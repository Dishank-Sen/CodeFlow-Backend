import { getRootTimelineEntryByIndex, type RootTimelineResponse } from '../services/rootTimeline.service.js';
import type { Socket } from "socket.io";

type ClientData = {
  userName: string;
  repoName: string;
  index: number;
};

type RootTimelineAck =
  | { ok: true; entry: NonNullable<RootTimelineResponse["data"]>["entry"] }
  | { ok: false; error: RootTimelineResponse["error"] | { code: string; message: string; details?: any } };

export default function rootTimelineHandler(socket: Socket) {
  return async (data: ClientData, ack?: (res: RootTimelineAck) => void) => {
    try {
      console.log("debug")
      const response: RootTimelineResponse = await getRootTimelineEntryByIndex({
        ownerName: data.userName,
        repoName: data.repoName,
        index: data.index,
      });

      if (!ack) {
        // fallback if client didn't provide ack (optional)
        if (!response.ok) socket.emit("rootTimeline:error", response.error);
        else socket.emit("rootTimeline:res", response.data?.entry);
        return;
      }

      if (!response.ok) {
        ack({ ok: false, error: response.error });
        return;
      }

      const entry = response.data?.entry;
      if (!entry) {
        ack({ ok: false, error: { code: "NO_ENTRY", message: "Timeline entry not found" } });
        return;
      }

      ack({ ok: true, entry });
    } catch (error: any) {
      console.error("rootTimeline handler error:", error);

      const errObj = {
        code: "HANDLER_ERROR",
        message: error?.message || "An unexpected error occurred",
        details: { error: error?.toString() },
      };

      if (ack) ack({ ok: false, error: errObj });
      else socket.emit("rootTimeline:error", errObj);
    }
  };
}
