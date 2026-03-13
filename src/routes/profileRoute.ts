import ProfileCardMiddleware from '../middleware/profileCardMiddleware.js'
import profileCardController from '../controllers/profile.card.controller.js'
import profileNavbarController from '../controllers/profile.navbar.controller.js'
import updateProfileController from '../controllers/updateProfile.controller.js'
import getSettingsController from '../controllers/getSettings.controller.js'
import updateSettingsController from '../controllers/updateSettings.controller.js'
import getUserRepositoriesController from '../controllers/getUserRepositories.controller.js'
import authenticateToken from '../middleware/authenticateToken.js'
import { signupUpload } from '../utils/upload.js'
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

router.patch(
    "/update",
    authenticateToken,
    signupUpload.single("profileImage"),
    updateProfileController
)

router.get(
    "/settings",
    authenticateToken,
    getSettingsController
)

router.patch(
    "/settings",
    authenticateToken,
    updateSettingsController
)

router.get(
    "/repositories",
    authenticateToken,
    getUserRepositoriesController
)

export default router