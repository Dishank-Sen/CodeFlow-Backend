import historyPushController from "../controllers/historyPushController.ts"
import express from "express"

const router = express.Router()

router.post("/history", historyPushController)

export default router