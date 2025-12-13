import type { Request, Response } from "express";
import Busboy from "busboy";
import unzipper from "unzipper";
import { Transform } from "stream";

import Repo from "../models/repo.models.ts";
import History from "../models/history.push.models.ts";
import FileTree from "../models/fileTree.push.models.ts";
import RootTimeline from "../models/rootTimeline.push.models.ts";

const pushController = async (req: Request, res: Response) => {
  const busboy = Busboy({ headers: req.headers });

  let metadata: { userName: string; repoName: string } | null = null;

  const batchSize = Number(process.env.BATCH_SIZE || 100);

  let historyBatch: any[] = [];
  let rootBatch: any[] = [];

  let activeStreams = 0;
  let responseSent = false;

  const received = {
    history: false,
    fileTree: false,
    rootTimeline: false,
  };

  function fail(status: number, msg: string) {
    if (!responseSent) {
      responseSent = true;
      res.status(status).send(msg);
    }
  }

  async function validateRepo() {
    if (!metadata) return;

    const exists = await Repo.exists({
      userName: metadata.userName.toLowerCase(),
      repoName_normalized: metadata.repoName.toLowerCase(),
    });

    if (!exists) {
      throw new Error("REPO_NOT_FOUND");
    }
  }

  async function flushHistory() {
    if (!metadata || historyBatch.length === 0) return;

    const docs = historyBatch.splice(0);
    await History.insertMany(
      docs.map((d) => ({
        ...d,
        ownerName: metadata!.userName,
        repoName: metadata!.repoName,
        timestamp: new Date(d.timestamp),
      }))
    );
  }

  async function flushRootTimeline() {
    if (!metadata || rootBatch.length === 0) return;

    const docs = rootBatch.splice(0);
    await RootTimeline.insertMany(
      docs.map((d) => ({
        ...d,
        ownerName: metadata!.userName,
        repoName: metadata!.repoName,
        timestamp: new Date(d.timestamp || d.createTime),
      }))
    );
  }

  function startStream() {
    activeStreams++;
  }

  async function endStream() {
    activeStreams--;

    if (activeStreams === 0 && !responseSent) {
      try {
        await flushHistory();
        await flushRootTimeline();

        // validate required uploads
        if (!received.history || !received.fileTree || !received.rootTimeline) {
          return fail(
            400,
            `Incomplete upload. Received: ${JSON.stringify(received)}`
          );
        }

        responseSent = true;
        res.status(200).send("upload complete");
      } catch (err) {
        console.error("final flush error:", err);
        fail(500, "Internal error during final flush");
      }
    }
  }

  // ───────────── fields ─────────────

  busboy.on("field", async (name, value) => {
    try {
      if (name === "metadata") {
        metadata = JSON.parse(value);
        await validateRepo();
      }
    } catch (err: any) {
      fail(404, "Repository not found");
    }
  });

  // ───────────── files ─────────────

  busboy.on("file", (fieldname, fileStream) => {
    if (!metadata) {
      fileStream.resume();
      return;
    }

    // ───── history.zip ─────
    if (fieldname === "history") {
      received.history = true;
      startStream();

      fileStream.pipe(unzipper.Parse()).pipe(
        new Transform({
          objectMode: true,
          async transform(entry, _, cb) {
            try {
              if (entry.type === "File") {
                const buf = await entry.buffer();
                historyBatch.push(JSON.parse(buf.toString()));

                if (historyBatch.length >= batchSize) {
                  await flushHistory();
                }
              } else {
                entry.autodrain();
              }
              cb();
            } catch (err) {
              cb(err as Error);
            }
          },
          async final(cb) {
            try {
              await flushHistory();
              await endStream();
              cb();
            } catch (err) {
              cb(err as Error);
            }
          },
        })
      );
    }

    // ───── fileTree.zip ─────
    else if (fieldname === "fileTree") {
      received.fileTree = true;
      startStream();

      fileStream
        .pipe(unzipper.Parse())
        .on("entry", async (entry) => {
          if (entry.type === "File") {
            const buf = await entry.buffer();
            const tree = JSON.parse(buf.toString());

            await FileTree.updateOne(
              {
                ownerName: metadata!.userName.toLowerCase(),
                repoName: metadata!.repoName.toLowerCase(),
              },
              {
                $set: {
                  files: tree,
                  timestamp: new Date(),
                },
              },
              {
                upsert: true,
              }
            );
          } else {
            entry.autodrain();
          }
        })
        .on("close", async () => {
          await endStream();
        });
    }

    // ───── root-timeline.zip ─────
    else if (fieldname === "root-timeline") {
      received.rootTimeline = true;
      startStream();

      fileStream.pipe(unzipper.Parse()).pipe(
        new Transform({
          objectMode: true,
          async transform(entry, _, cb) {
            try {
              if (entry.type === "File") {
                const buf = await entry.buffer();
                rootBatch.push(JSON.parse(buf.toString()));

                if (rootBatch.length >= batchSize) {
                  await flushRootTimeline();
                }
              } else {
                entry.autodrain();
              }
              cb();
            } catch (err) {
              cb(err as Error);
            }
          },
          async final(cb) {
            try {
              await flushRootTimeline();
              await endStream();
              cb();
            } catch (err) {
              cb(err as Error);
            }
          },
        })
      );
    } else {
      fileStream.resume();
    }
  });

  busboy.on("finish", () => {
    // IMPORTANT: do nothing here
    // real completion is tracked via activeStreams
  });

  req.pipe(busboy);
};

export default pushController;
