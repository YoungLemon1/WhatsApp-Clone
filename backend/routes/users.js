import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import bcrypt, { hash } from "bcrypt";
import User from "../models/user.js";
import mongoose from "mongoose";

const userRouter = Router();

userRouter.get("/", async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username: username });
    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.get("/all", async (req, res) => {
  try {
    const users = await User.find({});
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

    const user = await User.findById(id);
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

// auth user validation rules
const authUserValidationRules = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .escape(),
  body("password").notEmpty().withMessage("Password is required").trim(),
  // Add more validation rules as needed
];

userRouter.post(
  "/auth",
  authUserValidationRules,
  validate,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find the user by username
      const user = await User.findOne({ username: username });

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
  }
);

// create user validation rules
const createUserValidationRules = [
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
  // Add more validation rules as needed
];

userRouter.post("/", createUserValidationRules, validate, async (req, res) => {
  const { username, password } = req.body;
  // Check if username already exists in the database
  console.log(req.body);
  console.log(req.body.imageURL);
  const existingUser = await User.findOne({ username: username });
  if (existingUser) {
    return res.status(409).json({
      error: "Username already exists",
    });
  }
  // Create a new user
  const newUser = new User(req.body);
  console.log("new User", newUser);
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

userRouter.put(
  "/:id",
  createUserValidationRules,
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { username, password, birthdate, email, imageURL, role } = req.body;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(409).json({
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
  }
);

userRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { fieldToUpdate, updatedValue } = req.query;
  const validFields = Object.keys(userRouter.schema.obj);
  if (!id)
    return res
      .status(400)
      .json({ message: "id parameter is null or undefined" });
  if (!validFields.includes(fieldToUpdate)) {
    return res.status(400).json({ message: `Invalid field: ${fieldToUpdate}` });
  }
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { [fieldToUpdate]: updatedValue },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PATCH All users validation rules
const updateAllUsersValidationRules = [
  body("field").notEmpty().withMessage("Field is required").escape(),
  body("value").optional(),
];

// PATCH All users route
userRouter.patch(
  "/",
  updateAllUsersValidationRules,
  validate,
  async (req, res) => {
    try {
      const { fieldToUpdate, updatedValue } = req.body;
      // Update all users with the provided field and value
      const updateResult = await User.updateMany(
        {},
        { [fieldToUpdate]: updatedValue }
      );
      updateResult.forEach((doc) => {
        doc.save((saveErr) => {
          if (saveErr) {
            // Handle save error
            console.error("Failed to save document:", saveErr);
          }
        });
      });
      res.status(200).json({
        success: "All users updated successfully",
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        error: "Internal server error: failed to update users",
      });
    }
  }
);

userRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
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
