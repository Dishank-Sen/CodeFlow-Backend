import RootTimeline from '../models/rootTimeline.push.models.js';

export type RootTimelineMaxIndexResponse = {
  ok: boolean;
  data?: {
    ownerName: string;
    repoName: string;
    total: number;
    maxIndex: number; // 0-based max index = total - 1
  };
  error?: {
    code: "INVALID_INPUT" | "NOT_FOUND" | "DB_ERROR";
    message: string;
    details?: any;
  };
};

/**
 * Get max index for root timeline (0-based).
 * If total = 10, valid index range = 0..9, maxIndex = 9
 */
export async function getRootTimelineMaxIndex(params: {
  ownerName: string;
  repoName: string;
}): Promise<RootTimelineMaxIndexResponse> {
  const { ownerName, repoName } = params;

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

  try {
    const filter = { ownerName, repoName };

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

    return {
      ok: true,
      data: {
        ownerName,
        repoName,
        total,
        maxIndex: total - 1,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "DB_ERROR",
        message: "Database query failed while fetching root timeline max index.",
        details: {
          ownerName,
          repoName,
          errMessage: err?.message,
        },
      },
    };
  }
}
