import type { Request, Response } from "express";
import unzipper from "unzipper";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import Repo from "../models/repo.models.ts"

const historyPushController = async (req: Request, res: Response) => {
  try {
    const start = Date.now()
    const batchSize = parseInt(process.env.BATCH_SIZE || "100", 10);
    
    let inserting = false;
    const batch: any[] = [];
    const remoteUrl = "http://localhost:3000/Dishank-Sen/first"

    async function flush() {
      if (inserting || batch.length === 0) return;
      inserting = true;
      const toInsert = batch.splice(0, batch.length);
      await Repo.updateOne(
        { remoteUrl: remoteUrl },
        {
          $push: {
            history: {
              $each: toInsert
            }
          }
        }
      );
      console.log("pushed patch!")
      inserting = false;
    }

    await pipeline(
      req,
      unzipper.Parse(),
      new Transform({
        objectMode: true,
        async transform(entry, _, cb) {
          try {
            if (entry.type === "File") {
              const buf = await entry.buffer();
              const content = JSON.parse(buf.toString());
            //   console.log(content)
            //   console.log(typeof(content))
              batch.push(content);
              if (batch.length >= batchSize) await flush();
            } else entry.autodrain();
            cb();
          } catch (err) {
            cb(err instanceof Error ? err : new Error(String(err)));
          }
        },
      })
    );

    await flush();
    const end = Date.now()
    res.send(`upload complete in ${end-start} ms`);
  } catch (error) {
    console.error("Error in pushController:", error);
    res.status(500).send("Internal error");
  }
};

export default historyPushController;
