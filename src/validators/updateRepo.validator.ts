import { body } from "express-validator";

const updateRepoValidator = [
  body("description")
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage("description max length is 2000")
    .trim(),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage('visibility must be either "public" or "private"'),

  body("pinned")
    .optional()
    .isBoolean()
    .withMessage("pinned must be a boolean"),
];

export default updateRepoValidator;
