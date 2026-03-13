import express from "express";
import authenticateToken from '../middleware/authenticateToken.js'
import userDetailController from '../controllers/layout.navbar.controller.js'
import profileController from '../controllers/profile.pinnedRepository.controller.js'

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
