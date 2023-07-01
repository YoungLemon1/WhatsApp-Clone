import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt, { hash } from "bcrypt";
import UserModel from "../models/user.js";

const userRouter = Router();

userRouter.get("/", async (req, res) => {
  try {
    const { username } = req.query;
    const user = await UserModel.findOne({ username: username });
    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.get("/", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching users",
    });
  }
});

userRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.post("/auth", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await UserModel.findOne({ username: username });

    if (!user) {
      res.status(401).json({
        error: "Authentication failed: Invalid ucredentials",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({
        error: "Authentication failed: Invalid credentials",
      });
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const validationRules = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .escape(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
    .withMessage(
      "Password must have at least 6 characters, including one lowercase letter, one uppercase letter, and one number."
    )
    .trim(),
  body("email").trim().normalizeEmail(),
  // Add more validation rules as needed
];

userRouter.post("/", validationRules, validate, async (req, res) => {
  const { username, password, birthdate, email, imageURL, role } = req.body;
  // Check if username already exists in the database
  const existingUser = await UserModel.findOne({ username: username });
  if (existingUser) {
    return res.status(409).json({
      message: "Username already exists",
    });
  }
  // Create a new user
  const newUser = new UserModel(req.body);
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    newUser.password = hashedPassword;
  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({
      error: "Internal server error: failed to encrypt user password",
    });
  }

  // Save the new user to the database
  try {
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({
      error: "Internal server error: failed to save user",
    });
  }
});

userRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const requiredFields = ["name", "username", "password"];
  const { name, username, password, birthdate, email, imageURL, role } =
    req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  if (!requiredFields.every((field) => field in req.body)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await UserModel.findOne({ _id: id });
  if (!user) {
    return res.status(400).json({
      error: "Bad request: user does not exist",
    });
  }
  try {
    user.username = username;
    user.password = hashedPassword;
    user.birthdate = birthdate;
    user.role = role;
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to update user",
    });
  }
});

userRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await UserModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(400).json({
        error: "User does not exist",
      });
    }
    res.status(200).json({
      success: "User deleted successfully",
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete user",
    });
  }
});

export default userRouter;
