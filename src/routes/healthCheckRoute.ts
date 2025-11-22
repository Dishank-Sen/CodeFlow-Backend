import express from "express"
import type { Request, Response } from "express"

const router = express.Router()

/**
 * @openapi
 * /api/v1/health/ping:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns "pong" to confirm that the server is running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is online
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: pong
 */

router.get('/ping', (req: Request, res: Response) => {
    res.send("pong")
})

export default router