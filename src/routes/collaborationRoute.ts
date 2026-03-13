import collaborationController from '../controllers/collaboration.controller.js';
import authenticateToken from '../middleware/authenticateToken.js';
import express from "express";

const router = express.Router();

// Star/unstar, watch/unwatch, fork endpoints
router.post(
  "/:userName/:repoName/action",
  authenticateToken,
  collaborationController
);

export default router;
