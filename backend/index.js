import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import UserModel from "./models/users.js";

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

app.get("/getUsers", async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.json(users);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error fetching users" });
  }
});

app.post("/createUser", async (req, res) => {
  const user = req.body;
  const newUser = new UserModel(user);
  await newUser.save();

  res.json(user);
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
  res.status(404).json({ message: `Cannot GET / Route not found` });
});

app.listen(PORT);
