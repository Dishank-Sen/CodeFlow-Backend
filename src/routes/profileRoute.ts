import profileCardController from "../controllers/profile.card.controller.ts"
import profileNavbarController from "../controllers/profile.navbar.controller.ts"
import profilePinnedRepoController from "../controllers/profile.pinnedRepository.controller.ts"
import authenticateToken from "../middleware/authenticateToken.ts"
import express from "express"

const router = express.Router()

router.get(
    "/card",
    authenticateToken,
    profileCardController
)

router.get(
    "/navbar",
    authenticateToken,
    profileNavbarController
)

router.get(
    "/pinnedRepo",
    authenticateToken,
    profilePinnedRepoController
)

export default router