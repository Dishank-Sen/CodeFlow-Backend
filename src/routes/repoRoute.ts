import singleRepoController from "../controllers/singleRepo.controller.ts"
import allRepoController from "../controllers/allRepo.controller.ts"
import newRepoController from "../controllers/newRepo.controller.ts"
import authenticateToken from "../middleware/authenticateToken.ts"
import profilePinnedRepoController from "../controllers/profile.pinnedRepository.controller.ts"
import getFileTreeController from "../controllers/tree.controller.ts"
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

router.get(
    "/:userName/:repoName",
    authenticateToken,
    singleRepoController
)

router.get(
    "/pinned",
    authenticateToken,
    profilePinnedRepoController
)

router.get(
    "/:userName/:repoName/tree",
    authenticateToken,
    getFileTreeController
)

export default router