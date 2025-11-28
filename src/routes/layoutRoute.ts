import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts"
import userDetailController from "../controllers/layout.navbar.controller.ts"
import profileController from "../controllers/profile.pinnedRepository.controller.ts"

const router = express.Router();

router.get(
    "/navbar", 
    authenticateToken, 
    userDetailController
)

router.post(
    "/profile",
    authenticateToken,
    profileController
)

export default router;
