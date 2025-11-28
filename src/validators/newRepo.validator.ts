import { body } from "express-validator";

const newRepoValidator = [
  body("repoName")
    .exists({ checkFalsy: true })
    .withMessage("repoName is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("repoName must be 1-100 characters")
    .matches(/^[A-Za-z0-9._-]+$/)
    .withMessage(
      "repoName may only contain letters, numbers, dots, underscores and hyphens (no spaces)"
    )
    .trim()
    .escape(),

  body("description")
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage("description max length is 2000")
    .trim(),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage('visibility must be either "public" or "private"')
];

export default newRepoValidator;
