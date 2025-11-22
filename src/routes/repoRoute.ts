import allRepoController from "../controllers/allRepo.controller.ts"
import newRepoController from "../controllers/newRepo.controller.ts"
import authenticateToken from "../middleware/authenticateToken.ts"
import express from "express"

const router = express.Router()

router.post(
    "/new",
    authenticateToken,
    newRepoController
)

router.post(
    "/all",
    authenticateToken,
    allRepoController
)

export default router