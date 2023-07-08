import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { configDotenv } from "dotenv";
import userRouter from "./routes/users.js";
import messageRouter from "./routes/messages.js";
import chatroomRouter from "./routes/chatrooms.js";
import conversationRouter from "./routes/conversation.js";
import { log } from "console";

configDotenv();

const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const server = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const usersSockets = {};

io.on("connection", (socket) => {
  console.log(`socket id ${socket.id} connected`);

  socket.on("user_connected", (userId) => {
    console.log("user connected", userId);
    usersSockets[userId] = socket.id;
    console.log("user sokcets", usersSockets);
  });

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`user ${socket.id} joined room ${data}`);
  });
  socket.on("leave_room", (data) => {
    socket.leave(data);
    console.log(`user ${socket.id} left room ${data}`);
  });
  socket.on("send_message", (message, recipients, senderData) => {
    const recipientSockets = recipients.map(
      (recipient) => usersSockets[recipient]
    );
    recipientSockets.forEach((recipient) => {
      socket.to(recipient).emit("receive_message", message, senderData);
    });
  });
  socket.on("disconnect", () => {
    console.log(`socket id ${socket.id} disconnected`);

    const userId = Object.keys(usersSockets).find(
      (key) => usersSockets[key] === socket.id
    );
    if (userId) {
      delete usersSockets[userId];
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB`);
    console.log(`Connected to database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("Error connecting to Mongo", err);
  });

//routers
app.use("/users", userRouter);
app.use("/messages", messageRouter);
app.use("/chatrooms", chatroomRouter);
app.use("/conversations", conversationRouter);

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

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
