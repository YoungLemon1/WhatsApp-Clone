import { Router } from "express";
import ChatRoomModel from "../models/chatroom.js";
const chatRoomRouter = Router();

chatRoomRouter.get("/", async (req, res) => {
  try {
    const chatrooms = await ChatRoomModel.find({});
    res.status(200).json({
      data: chatrooms,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatrooms",
    });
  }
});

chatRoomRouter.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatrooms = await ChatRoomModel.find({ members: { $in: [id] } });
    res.status(200).json({
      data: chatrooms,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

chatRoomRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatroom = await ChatRoomModel.findById(id);
    res.status(200).json({
      data: chatroom,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

chatRoomRouter.post("/", async (req, res) => {
  const { name, username, birthdate, role } = req.body;

  // Check if username already exists in the database
  const existingUser = await ChatRoomModel.findOne({ username });
  if (existingUser) {
    return res.status(400).json({
      error: "Chatroom already exists",
    });
  }
  try {
    const newChatroom = new ChatRoomModel(req.body);
    await newChatroom.save();

    res.status(201).json({
      data: newChatroom,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to create chatroom",
    });
  }
});

chatRoomRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedChatroom = await ChatRoomModel.findByIdAndDelete(id);
    if (!deletedChatroom) {
      return res.status(400).json({
        error: "chatroom does not exist",
      });
    }
    res.status(200).json({
      success: "chatroom deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to delete chatroom",
    });
  }
});

export default chatRoomRouter;
