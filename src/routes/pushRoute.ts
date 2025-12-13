import pushController from "../controllers/pushController.ts"
import express from "express"

const router = express.Router()

router.post("/", pushController)

export default router