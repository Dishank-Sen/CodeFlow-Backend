// handlers/rootTimelineMaxIndex.handler.ts
import { getRootTimelineMaxIndex, type RootTimelineMaxIndexResponse } from "../services/rootTimelineMaxIndex.ts";
import type { Socket } from "socket.io";

type RootMaxIndexReq = {
  userName: string;
  repoName: string;
};

type RootMaxIndexAck =
  | { ok: true; maxIndex: number }
  | { ok: false; error: RootTimelineMaxIndexResponse["error"] | { code: string; message: string; details?: any } };

export default function rootTimelineMaxIndexHandler(socket: Socket) {
  return async (data: RootMaxIndexReq, ack?: (res: RootMaxIndexAck) => void) => {
    try {
      const response: RootTimelineMaxIndexResponse = await getRootTimelineMaxIndex({
        ownerName: data.userName,
        repoName: data.repoName,
      });

      if (!ack) {
        if (!response.ok) socket.emit("rootTimeline:maxIndex:error", response.error);
        else socket.emit("rootTimeline:maxIndex:res", response.data?.maxIndex);
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
      console.error("rootTimelineMaxIndex handler error:", error);

      const errObj = {
        code: "HANDLER_ERROR",
        message: error?.message || "An unexpected error occurred",
        details: { error: error?.toString() },
      };

      if (ack) ack({ ok: false, error: errObj });
      else socket.emit("rootTimeline:maxIndex:error", errObj);
    }
  };
}
