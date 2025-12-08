import express from "express"
import http from "http"
import { Server } from "socket.io"
import Timeline from "../models/timeline.push.model.ts"
import { diff_match_patch } from "diff-match-patch"

const app = express()
const server = http.createServer(app)

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const io = new Server(server, {
    cors: { origin: allowedOrigins}
})

io.on("connection", (socket) => {
  console.log("connected to ws server");

  socket.emit("ping", "pong");

  socket.on("getMaxIndex", async ({ fileName, ownerName, repoName }) => {
    try {
      // find timeline doc
      const doc = await Timeline.findOne({ ownerName, repoName }).lean();

      if (!doc || !Array.isArray(doc.history)) {
        socket.emit("maxIndex", { fileName, maxIndex: 0 });
        return;
      }

      // filter history entries for that file
      const entries = doc.history.filter(h => h.file === fileName);

      // max index = last valid index (0-based)
      const index = Math.max(0, entries.length);
      console.log("max index: ",index)

      socket.emit("maxIndex", { fileName, index });
    } catch (err) {
      console.error("getMaxIndex error:", err);
      socket.emit("maxIndex", { fileName, maxIndex: 0 });
    }
  });


  socket.on("file", async ({ fileName, ownerName, repoName, index }) => {
    try {
      if (!fileName || !ownerName || !repoName || !index) {
        socket.emit("fileError", { message: "missing params" });
        return;
      }

      ownerName = ownerName.trim().toLowerCase()
      repoName = repoName.trim().toLowerCase()
      const limit = typeof index === "number" && index >= 0 ? index : 1; // slice length

      console.log(ownerName, "  ", repoName, "   ", fileName, "   ", index)

      // Aggregate to return only the history for the requested file and slice up to the index
      const pipeline = [
        { $match: { ownerName, repoName } },
        {
          $project: {
            history: {
              $slice: [
                {
                  $filter: {
                    input: "$history",
                    as: "h",
                    cond: { $eq: ["$$h.file", fileName] },
                  },
                },
                limit > 0 ? limit : 1,
              ],
            },
          },
        },
      ];

      const agg = await Timeline.aggregate(pipeline).exec();
      if (!agg || agg.length === 0) {
        socket.emit("fileError", { message: "timeline not found" });
        return;
      }

      const entries = agg[0].history || [];
      if (entries.length === 0) {
        socket.emit("fileError", { message: "no history for file" });
        return;
      }

      // find last snapshot index within entries (the most recent snapshot we have in the sliced entries)
      let lastSnapshotIdx = -1;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.type === "snapshot" && e.action === "write") lastSnapshotIdx = i;
      }

      if (lastSnapshotIdx === -1) {
        socket.emit("fileError", { message: "no snapshot available to reconstruct from" });
        return;
      }

      // start from snapshot content
      let content = entries[lastSnapshotIdx].content ?? "";

      // apply deltas after snapshot (up to last returned entry)
      const dmp = new diff_match_patch();

      for (let i = lastSnapshotIdx + 1; i < entries.length; i++) {
        const e = entries[i];
        if (e.type === "delta" && e.action === "write" && e.content) {
          try {
            const patchText = e.content;
            const patches = dmp.patch_fromText(patchText);
            const [newText, results] = dmp.patch_apply(patches, content);
            // results is an array of booleans indicating which patches applied
            content = newText;
          } catch (err) {
            console.error("patch apply error for entry", e._id, err);
            socket.emit("fileError", { message: "patch apply failed", err: String(err) });
            return;
          }
        }
      }
      console.log(content)
      // return the reconstructed content
      socket.emit("fileContent", { fileName, content, usedEntries: entries.length });
    } catch (err) {
      console.error("error in file handler:", err);
      socket.emit("fileError", { message: "server error", err: String(err) });
    }
  });

  socket.on("disconnect", () => {
    console.log("connection closed");
  });
});

server.listen(4000, () => console.log("socket.io listening on :4000"));


import type { Request, Response, RequestHandler } from "express";
import Repo from "../models/repo.models.ts"
import mongoose from "mongoose"

const singleRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userName = req.params.userName
        const repoName = req.params.repoName

        if(!userName || !repoName){
            return res.status(400).json({ error: "USERNAME-OR-REPONAME-NOT-PROVIDED", message: "username or reponame is not provided!"})
        }

        const repoData = await Repo.findOne({ userName: userName, repoName: repoName})

        if(!repoData){
            return res.status(404).json({ error: "DATA-NOT-FOUND", message: "repository data not found!"})
        }

        return res.status(200).json({ message: "DATA-FETCHED-SUCCESSFULLY", data: repoData})
    } catch (error) {
        console.log("error in singleRepo.controller: ",error)
        return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error!"})
    }
}

export default singleRepoController