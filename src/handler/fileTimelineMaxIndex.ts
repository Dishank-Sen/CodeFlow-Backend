// handlers/fileTimelineMaxIndex.handler.ts
import { getFileTimelineMaxIndex, type FileTimelineMaxIndexResponse } from "../services/fileTimelineMaxIndex.ts";
import type { Socket } from "socket.io";

type FileMaxIndexReq = {
  userName: string;
  repoName: string;
  filePath: string;
};

type FileMaxIndexAck =
  | { ok: true; maxIndex: number }
  | { ok: false; error: FileTimelineMaxIndexResponse["error"] | { code: string; message: string; details?: any } };

export default function fileTimelineMaxIndexHandler(socket: Socket) {
  return async (data: FileMaxIndexReq, ack?: (res: FileMaxIndexAck) => void) => {
    try {
      const response: FileTimelineMaxIndexResponse = await getFileTimelineMaxIndex({
        ownerName: data.userName,
        repoName: data.repoName,
        filePath: data.filePath,
      });

      if (!ack) {
        if (!response.ok) socket.emit("fileTimeline:maxIndex:error", response.error);
        else socket.emit("fileTimeline:maxIndex:res", response.data?.maxIndex);
        return;
      }

      if (!response.ok) {
        ack({ ok: false, error: response.error });
        return;
      }

      const maxIndex = response.data?.maxIndex;
      if (typeof maxIndex !== "number") {
        ack({ ok: false, error: { code: "NO_MAX_INDEX", message: "Max index not found" } });
        return;
      }

      ack({ ok: true, maxIndex });
    } catch (error: any) {
      console.error("fileTimelineMaxIndex handler error:", error);

      const errObj = {
        code: "HANDLER_ERROR",
        message: error?.message || "An unexpected error occurred",
        details: { error: error?.toString() },
      };

      if (ack) ack({ ok: false, error: errObj });
      else socket.emit("fileTimeline:maxIndex:error", errObj);
    }
  };
}
