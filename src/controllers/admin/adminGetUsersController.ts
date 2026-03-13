import { Response } from "express";
import User from '../../models/user.models.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';

export async function adminGetUsersController(
  req: AdminRequest,
  res: Response
) {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("_id userName email profileImg adminRole createdAt accountStatus")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch users",
    });
  }
}
