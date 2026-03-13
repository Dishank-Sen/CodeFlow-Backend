import { body } from "express-validator";
import reservedUserNames from '../utils/reservedUserNames.js'

const signupValidator = [
  body("userName")
    .notEmpty()
    .withMessage("Username is required.")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens.")
    .custom((value: any) => {
      if (reservedUserNames.includes(value.toLowerCase())) {
        throw new Error(`The username '${value}' is reserved and cannot be used.`);
      }
      return true;
    }),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email."),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
];

export default signupValidator