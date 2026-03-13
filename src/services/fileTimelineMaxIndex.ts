// services/fileTimelineMaxIndex.service.ts
import History from '../models/history.push.models.js';

export type FileTimelineMaxIndexResponse = {
  ok: boolean;
  data?: {
    ownerName: string;
    repoName: string;
    filePath: string;
    total: number;
    maxIndex: number; // 0-based => total - 1
  };
  error?: {
    code: "INVALID_INPUT" | "NOT_FOUND" | "DB_ERROR";
    message: string;
    details?: any;
  };
};

/**
 * Get max index for a file timeline (0-based).
 * total = N => valid index range is 0..N-1 => maxIndex = N-1
 */
export async function getFileTimelineMaxIndex(params: {
  ownerName: string;
  repoName: string;
  filePath: string; // History.path
}): Promise<FileTimelineMaxIndexResponse> {
  const { ownerName, repoName, filePath } = params;

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

  try {
    const filter = { ownerName, repoName, path: filePath };

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

    return {
      ok: true,
      data: {
        ownerName,
        repoName,
        filePath,
        total,
        maxIndex: total - 1,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "Database query failed while fetching file timeline max index.",
        details: {
          ownerName,
          repoName,
          filePath,
          errMessage: err?.message,
        },
      },
    };
  }
}
