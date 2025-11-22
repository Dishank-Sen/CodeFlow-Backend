import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts"
import userDetailController from "../controllers/layout.navbar.controller.ts"
import profileController from "../controllers/profile.pinnedRepository.controller.ts"
import profileNavbarController from "../controllers/profile.navbar.controller.ts"
import profileCardController from "../controllers/profile.card.controller.ts";

const router = express.Router();

router.get(
    "/layout/navbar", 
    authenticateToken, 
    userDetailController
)

router.post(
    "/profile",
    authenticateToken,
    profileController
)

router.get("/profile/navbar", 
    authenticateToken, 
    profileNavbarController
)

router.get("/profile/card", 
    authenticateToken, 
    profileCardController
)

export default router;
