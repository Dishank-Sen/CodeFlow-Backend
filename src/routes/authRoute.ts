import express from "express";
import loginController from '../controllers/login.controller.js';
import loginValidator from '../validators/login.validator.js';
import signupController from '../controllers/signup.controller.js';
import signupValidator from '../validators/signup.validator.js';
import logoutController from '../controllers/logout.controller.js';
import { signupUpload } from '../utils/upload.js';
import signupMiddleware from '../middleware/signupMiddleware.js';
import authStatusController from '../controllers/authStatus.controller.js';
import loginMiddleware from '../middleware/loginMiddleware.js';
import savePublicKey from "../controllers/publicKey.controller.ts";
import challengeController from "../controllers/challenge.controller.ts";
import verifyChallengeController from "../controllers/verifyChallenge.controller.ts";

const router = express.Router();

router.post(
    "/login", 
    loginValidator, 
    loginController
);

router.post(
    "/signup",
    signupMiddleware,
    signupUpload.single("file"),
    signupValidator,
    signupController
);

router.post(
    "/logout", 
    logoutController
);

router.get(
    "/status",
    loginMiddleware,
    authStatusController
)

router.post(
    "/savePublickey",
    loginMiddleware,
    savePublicKey
)

router.post(
    "/challenge",
    challengeController
)

router.post(
    "/verifyChallenge",
    verifyChallengeController
)
export default router;
