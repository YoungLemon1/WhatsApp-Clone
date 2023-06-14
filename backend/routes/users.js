import { Router } from "express";
import { body } from "express-validator";
import crypto from "crypto";
import bcrypt, { hash } from "bcrypt";
import UserModel from "../models/user.js";
import { log } from "console";
const userRouter = Router();

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
    const { id } = req.params;
    const user = await UserModel.findById(id);
    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.get("/username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await UserModel.findOne({ username: username });
    res.status(200).json(user);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.post("/", async (req, res) => {
  const requiredFields = ["name", "username", "password"];
  const { name, username, password, birthdate, email, imageURL, role } =
    req.body;
  if (!requiredFields.every((field) => field in req.body)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  // Check if username already exists in the database
  const existingUser = await UserModel.findOne({ username: username });
  if (existingUser) {
    return res.status(400).json({
      error: "Username already exists",
    });
  }
  const newUser = new UserModel(req.body);
  try {
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed password:", hashedPassword);
    newUser.password = hashedPassword;
  } catch (error) {
    res.status(500).json({
      error: "Internal server error: failed to encrypt user password",
    });
  }
  try {
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to create user",
    });
  }
});

userRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const requiredFields = ["name", "username", "password"];
  const { name, username, password, birthdate, role } = req.body;
  if (!requiredFields.every((field) => field in req.body)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  // Check if username already exists in the database
  const user = await UserModel.findOne({ _id: id });
  if (!user) {
    return res.status(400).json({
      error: "Bad request: user does not exist",
    });
  }
  try {
    user.name = name;
    user.username = username;
    user.birthdate = birthdate;
    user.role = role;

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
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
    resres.status(200).json({
      success: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to delete user",
    });
  }
});

userRouter.post("/compare-password", async (req, res) => {
  const { password, hashedPassword } = req.body;

  try {
    const result = await bcrypt.compare(password, hashedPassword);
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: Failed to compare passwords",
    });
  }
});

export default userRouter;
