import express from "express";
import loginController from "../controllers/login.controller.ts";
import loginValidator from "../validators/loginValidator.ts";
import signupController from "../controllers/signup.controller.ts";
import signupValidator from "../validators/signupValidator.ts";
import logoutController from "../controllers/logout.controller.ts";
import { signupUpload } from "../utils/upload.ts";
import signupMiddleware from "../middleware/signupMiddleware.ts";

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

export default router;
