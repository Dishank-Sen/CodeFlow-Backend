import pushController from '../controllers/pushController.js'
import authenticateToken from '../middleware/authenticateToken.js'
import express from "express"
import History from '../models/history.push.models.js'
import type { Response } from "express"
import { successResponse, errorResponse } from '../utils/errorResponse.js'

const router = express.Router()

router.post("/", pushController)

// Get commit history for a repository
router.get(
    "/:userName/:repoName/history",
    authenticateToken,
    async (req, res) => {
        try {
            const { userName, repoName } = req.params
            const userNameStr = typeof userName === 'string' ? userName : userName[0];
            const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];

            if (!userNameStr || !repoNameStr) {
                return errorResponse(res, 400, "userName and repoName are required", "MISSING_PARAMS")
            }

            // Get commit history, sorted by timestamp descending
            const history = await History.find({
                ownerName: userNameStr.toLowerCase(),
                repoName: repoNameStr.toLowerCase()
            })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean()

            return successResponse(res, 200, "Commit history retrieved", { history })
        } catch (error: any) {
            console.error("Error fetching commit history:", error)
            return errorResponse(res, 500, "Internal server error", "SERVER_ERROR")
        }
    }
)

// Get file history for a specific file in a repository
router.get(
    "/:userName/:repoName/file-history/:filePath",
    authenticateToken,
    async (req, res) => {
        try {
            const { userName, repoName, filePath } = req.params
            const userNameStr = typeof userName === 'string' ? userName : userName[0];
            const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];
            const filePathStr = typeof filePath === 'string' ? filePath : filePath[0];

            if (!userNameStr || !repoNameStr || !filePathStr) {
                return errorResponse(res, 400, "userName, repoName, and filePath are required", "MISSING_PARAMS")
            }

            // Decode file path if it's URL encoded
            const decodedPath = decodeURIComponent(filePathStr)

            // Get file history, sorted by timestamp descending
            const fileHistory = await History.find({
                ownerName: userNameStr.toLowerCase(),
                repoName: repoNameStr.toLowerCase(),
                path: decodedPath
            })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean()

            return successResponse(res, 200, "File history retrieved", { fileHistory })
        } catch (error: any) {
            console.error("Error fetching file history:", error)
            return errorResponse(res, 500, "Internal server error", "SERVER_ERROR")
        }
    }
)

export default router