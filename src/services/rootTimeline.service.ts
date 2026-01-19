import RootTimeline from "../models/rootTimeline.push.models.ts";

type RootTimelineAction = "create" | "remove" | "rename" | "move";

export type RootTimelineResponse = {
  ok: boolean;
  data?: {
    ownerName: string;
    repoName: string;
    index: number;
    total: number;
    entry: {
      id: string;
      action: RootTimelineAction;
      path: string;
      name?: string | null;
      isDir?: boolean | null;
      size?: number | null;
      newPath?: string | null;
      newName?: string | null;
      timestamp: string; // ISO
      payload?: unknown;
    };
  };
  error?: {
    code:
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "INDEX_OUT_OF_RANGE"
      | "DB_ERROR";
    message: string;
    details?: any;
  };
};

/**
 * Get the Nth latest timeline entry (0-based) by timestamp desc.
 * index=0 => most recent entry
 */
export async function getRootTimelineEntryByIndex(params: {
  ownerName: string;
  repoName: string;
  index: number; // 0-based
}): Promise<RootTimelineResponse> {
  const { ownerName, repoName, index } = params;

  // ---- validation ----
  if (!ownerName || !repoName) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "ownerName and repoName are required.",
      },
    };
  }

  if (!Number.isInteger(index) || index < 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "index must be a non-negative integer (0-based).",
        details: { index },
      },
    };
  }

  try {
    // Query filter
    const filter = { ownerName, repoName };

    // Total count (useful for UI pagination / range checks)
    const total = await RootTimeline.countDocuments(filter);

    if (total === 0) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "No timeline entries found for this owner/repo.",
          details: { ownerName, repoName },
        },
      };
    }

    if (index >= total) {
      return {
        ok: false,
        error: {
          code: "INDEX_OUT_OF_RANGE",
          message: `index is out of range. Valid range: 0..${total - 1}`,
          details: { index, total },
        },
      };
    }

    // Get the Nth latest entry by timestamp desc
    const doc = await RootTimeline.findOne(filter)
      .sort({ timestamp: -1 })
      .skip(index)
      .lean();

    if (!doc) {
      // Shouldn't happen if count + index check passed, but keep it safe.
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Timeline entry not found at the requested index.",
          details: { ownerName, repoName, index },
        },
      };
    }

    // ---- format response ----
    return {
      ok: true,
      data: {
        ownerName,
        repoName,
        index,
        total,
        entry: {
          id: String(doc._id),
          action: doc.action as RootTimelineAction,
          path: doc.path,
          name: doc.name ?? null,
          isDir: doc.isDir ?? null,
          size: doc.size ?? null,
          newPath: doc.newPath ?? null,
          newName: doc.newName ?? null,
          timestamp: new Date(doc.timestamp).toISOString(),
          payload: doc.payload ?? undefined,
        },
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "Database query failed while fetching timeline entry.",
        details: {
          ownerName,
          repoName,
          index,
          errMessage: err?.message,
        },
      },
    };
  }
}
