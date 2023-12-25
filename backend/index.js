import express from "express";
import "express-async-errors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { configDotenv } from "dotenv";
import userRouter from "./routes/users.js";
import messageRouter from "./routes/messages.js";
import chatroomRouter from "./routes/chatrooms.js";
import conversationRouter from "./routes/conversation.js";

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

const userSockets = {};

io.on("connection", (socket) => {
  console.log(`socket id ${socket.id} connected`);
  socket.on("user_connected", (userId) => {
    console.log("user connected", userId);
    userSockets[userId] = socket.id;
    console.log("user sockets", userSockets);
  });
  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`user ${socket.id} joined room ${data}`);
  });
  socket.on("leave_room", (data) => {
    socket.leave(data);
    console.log(`user ${socket.id} left room ${data}`);
  });
  socket.on(
    "send_message",
    (
      message,
      senderProfileData,
      chatProfileData,
      chatId,
      chatStrObjectId,
      members,
      isGroupChat
    ) => {
      console.log("message exists", !!message);
      console.log("senderData exists", !!senderProfileData);
      console.log("chat profile data exists", !!chatProfileData);
      console.log("chatId exists", !!chatId);
      console.log("chatStrObjectId exists", !!chatStrObjectId);
      console.log("members exists", !!members);
      const memberSockets = members.map((member) => userSockets[member]);
      socket.to(chatId).emit("receive_message", message, chatProfileData);
      // Emit to individual users for updating their chat history
      if (!memberSockets.includes(socket.id)) {
        memberSockets.push(socket.id);
      }
      memberSockets.forEach((memberSocket) => {
        socket
          .to(memberSocket)
          .emit(
            "update_chat_history",
            message,
            senderProfileData,
            chatProfileData,
            chatId,
            chatStrObjectId,
            members,
            isGroupChat
          );
      });

      // Emit to sender for updating their chat history
      socket.emit(
        "update_chat_history",
        message,
        senderProfileData,
        chatProfileData,
        chatId,
        chatStrObjectId
      );
    }
  );
  socket.on("new_chat", (chatId, chatStrObjectId) => {
    socket.to(chatId).emit("update_new_chat", chatStrObjectId);
  });
  socket.on("disconnect", () => {
    console.log(`socket id ${socket.id} disconnected`);

    const userId = Object.keys(userSockets).find(
      (key) => userSockets[key] === socket.id
    );
    if (userId) {
      delete userSockets[userId];
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
