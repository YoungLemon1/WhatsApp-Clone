import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import UserModel from "./models/users.js";
import { body, validationResult } from "express-validator";

configDotenv();

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`Listening on port ${PORT}`);
    console.log(`Connected to MongoDB`);
    console.log(`Connected to database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("Error connecting to Mongo", err);
  });

app.get("/users", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching users",
    });
  }
});

app.post(
  "/users",
  [
    body("name").notEmpty(),
    body("username").notEmpty(),
    body("role").notEmpty(),
  ],
  async (req, res) => {
    const { name, username, birthdate, role } = req.body;

    // Check if username already exists in the database
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists",
      });
    }
    try {
      const user = req.body;
      const newUser = new UserModel(user);
      await newUser.save();

      res.json({
        success: newUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error: failed to create user",
      });
    }
  }
);

app.put(
  "/users/:id",
  [
    body("name").notEmpty(),
    body("username").notEmpty(),
    body("role").notEmpty(),
  ],
  async (req, res) => {
    const { id } = req.params;
    const { name, username, birthdate, role } = req.body;

    // Check if username already exists in the database
    const existingUser = await UserModel.findOne({ _id: id });
    if (!existingUser) {
      return res.status(400).json({
        error: "Bad request: user does not exist",
      });
    }
    try {
      existingUser.name = name;
      existingUser.username = username;
      existingUser.birthdate = birthdate;
      existingUser.role = role;

      await existingUser.save();

      res.json({
        success: existingUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error: failed to update user",
      });
    }
  }
);

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, username, birthdate, role } = req.body;
  try {
    const deletedUser = await UserModel.findByIdAndDelete(id);
    if (!existingUser) {
      return res.status(400).json({
        error: "User does not exist",
      });
    }
    res.json({
      success: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to delete user",
    });
  }
});
// API routes
/*app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/messages", require("./routes/messages"));
*/

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot GET / Route not found`,
  });
});

app.listen(PORT);
