import type { Socket } from "socket.io";
import {
  reconstructFileAtIndex,
  type FileReconstructionResponse,
} from '../services/fileReconstruct.js';

type FileTimelineReq = {
  userName: string;
  repoName: string;
  filePath: string;
  index: number; // 0-based
};

type FileTimelineAck =
  | {
      ok: true;
      data: NonNullable<FileReconstructionResponse["data"]>;
    }
  | {
      ok: false;
      error:
        | FileReconstructionResponse["error"]
        | { code: string; message: string; details?: any };
    };

export default function fileTimelineHandler(socket: Socket) {
  return async (data: FileTimelineReq, ack?: (res: FileTimelineAck) => void) => {
    console.log("file debug")
    try {
      const response = await reconstructFileAtIndex({
        ownerName: data.userName,
        repoName: data.repoName,
        filePath: data.filePath,
        index: data.index,
      });

      // fallback if client didn't provide ack (optional)
      if (!ack) {
        if (!response.ok) socket.emit("fileTimeline:error", response.error);
        else socket.emit("fileTimeline:res", response.data);
        return;
      }

      if (!response.ok) {
        ack({ ok: false, error: response.error });
        return;
      }

      const payload = response.data;
      if (!payload) {
        ack({ ok: false, error: { code: "NO_DATA", message: "No data returned" } });
        return;
      }

      ack({ ok: true, data: payload });
    } catch (error: any) {
      console.error("fileTimeline handler error:", error);

      const errObj = {
        code: "HANDLER_ERROR",
        message: error?.message || "An unexpected error occurred",
        details: { error: error?.toString() },
      };

      if (ack) ack({ ok: false, error: errObj });
      else socket.emit("fileTimeline:error", errObj);
    }
  };
}
