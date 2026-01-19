import History from "../models/history.push.models.ts";
import { diff_match_patch } from "diff-match-patch";

type HistoryType = "snapshot" | "delta";

type HistoryDocLean = {
  _id: any;
  ownerName: string;
  repoName: string;
  path: string;
  type: HistoryType;
  content: string; // snapshot text OR delta patch text
  timestamp: Date;
  currentSize?: number | null;
};

export type FileReconstructionResponse = {
  ok: boolean;
  data?: {
    ownerName: string;
    repoName: string;
    filePath: string;

    index: number; // requested 0-based index
    total: number; // total history entries for this file
    reconstructedFromIndex: number; // snapshot index we started from

    timestamp: string; // ISO of the requested version entry
    type: HistoryType; // type of requested entry

    content: string; // reconstructed full file text
    currentSize?: number;
  };
  error?: {
    code:
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "INDEX_OUT_OF_RANGE"
      | "NO_SNAPSHOT"
      | "PATCH_APPLY_FAILED"
      | "DB_ERROR";
    message: string;
    details?: any;
  };
};

/**
 * Reconstruct file content at Nth version (0-based) for a given filePath.
 *
 * Storage model:
 * - "snapshot": full content at that time
 * - "delta": patch string that transforms previous version -> next version
 *
 * Important: delta is expected to be diff-match-patch patch text.
 */
export async function reconstructFileAtIndex(params: {
  ownerName: string;
  repoName: string;
  filePath: string;
  index: number; // 0-based
}): Promise<FileReconstructionResponse> {
  const { ownerName, repoName, filePath, index } = params;

  // ---- validation ----
  if (!ownerName || !repoName || !filePath) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "ownerName, repoName and filePath are required.",
        details: { ownerName, repoName, filePath },
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
    const filter = { ownerName, repoName, path: filePath };

    // total versions for this file
    const total = await History.countDocuments(filter);

    if (total === 0) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "No history entries found for this file.",
          details: { ownerName, repoName, filePath },
        },
      };
    }

    if (index >= total) {
      return {
        ok: false,
        error: {
          code: "INDEX_OUT_OF_RANGE",
          message: `index out of range. Valid: 0..${total - 1}`,
          details: { index, total },
        },
      };
    }

    /**
     * We only need entries up to requested index.
     * Sort ascending so we can apply patches forward.
     */
    const docs: HistoryDocLean[] = await History.find(filter)
      .sort({ timestamp: 1 })
      .limit(index + 1)
      .lean();

    if (!docs || docs.length === 0) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "History entries not found.",
          details: { ownerName, repoName, filePath, index },
        },
      };
    }

    // Find latest snapshot <= index to start reconstruction
    let snapshotIdx = -1;
    for (let i = docs.length - 1; i >= 0; i--) {
      if (docs[i].type === "snapshot") {
        snapshotIdx = i;
        break;
      }
    }

    if (snapshotIdx === -1) {
      return {
        ok: false,
        error: {
          code: "NO_SNAPSHOT",
          message: "No snapshot found to reconstruct from.",
          details: { filePath, index },
        },
      };
    }

    // Start from snapshot content
    let text = docs[snapshotIdx].content ?? "";

    // Apply deltas forward from snapshotIdx+1 to index
    const dmp = new diff_match_patch();

    for (let i = snapshotIdx + 1; i < docs.length; i++) {
      const doc = docs[i];

      if (doc.type === "snapshot") {
        // Optional optimization:
        // If a snapshot appears later, you can reset text to it.
        text = doc.content ?? "";
        continue;
      }

      // delta patch expected
      const patchText = doc.content ?? "";
      const patches = dmp.patch_fromText(patchText);

      const [newText, results] = dmp.patch_apply(patches, text);

      // If any patch failed, it means delta doesn't match the expected base content
      const allApplied = results.every(Boolean);
      if (!allApplied) {
        return {
          ok: false,
          error: {
            code: "PATCH_APPLY_FAILED",
            message: "Failed to apply patch while reconstructing file.",
            details: {
              filePath,
              index,
              failedAt: i,
              results,
            },
          },
        };
      }

      text = newText;
    }

    const requestedDoc = docs[index];

    return {
      ok: true,
      data: {
        ownerName,
        repoName,
        filePath,
        index,
        total,
        reconstructedFromIndex: snapshotIdx,
        timestamp: new Date(requestedDoc.timestamp).toISOString(),
        type: requestedDoc.type,
        content: text,
        currentSize: requestedDoc.currentSize ?? undefined,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "Database query failed while reconstructing file.",
        details: {
          ownerName,
          repoName,
          filePath,
          index,
          errMessage: err?.message,
        },
      },
    };
  }
}
