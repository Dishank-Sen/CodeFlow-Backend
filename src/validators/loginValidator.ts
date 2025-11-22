import { body } from "express-validator"

const loginValidator = [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
]

export default loginValidator