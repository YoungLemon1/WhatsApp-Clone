import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import UserModel from "./models/users.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`Listening on port ${PORT}\nConnected to Mongo!`);
  })
  .catch((err) => {
    console.error("Error connecting to Mongo", err);
  });

app.get("/getUsers", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.json(users);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error fetching users" });
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
  res.status(500).json({ message: "Internal Server Error" });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT);
