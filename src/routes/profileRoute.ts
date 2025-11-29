import ProfileCardMiddleware from "../middleware/profileCardMiddleware.ts"
import profileCardController from "../controllers/profile.card.controller.ts"
import profileNavbarController from "../controllers/profile.navbar.controller.ts"
import authenticateToken from "../middleware/authenticateToken.ts"
import express from "express"

const router = express.Router()

router.get(
    "/card",
    ProfileCardMiddleware,
    profileCardController
)

router.get(
    "/navbar",
    authenticateToken,
    profileNavbarController
)

export default router