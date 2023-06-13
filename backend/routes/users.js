import { Router } from "express";
import { body } from "express-validator";
import UserModel from "../models/user.js";
const userRouter = Router();

userRouter.get("/", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json({
      data: users,
    });
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
    res.status(200).json({
      data: user,
    });
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
    res.status(200).json({
      data: user,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user",
    });
  }
});

userRouter.post(
  "/",
  [
    body("name").notEmpty(),
    body("username").notEmpty(),
    body("role").notEmpty(),
  ],
  async (req, res) => {
    const { name, username, birthdate, role } = req.body;

    // Check if username already exists in the database
    const existingUser = await UserModel.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists",
      });
    }
    try {
      const newUser = new UserModel(req.body);
      await newUser.save();

      res.status(201).json({
        data: newUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error: failed to create user",
      });
    }
  }
);

userRouter.put(
  "/:id",
  [
    body("name").notEmpty(),
    body("username").notEmpty(),
    body("role").notEmpty(),
  ],
  async (req, res) => {
    const { id } = req.params;
    const { name, username, birthdate, role } = req.body;

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

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error: failed to update user",
      });
    }
  }
);

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

export default userRouter;
