import { Router } from "express";
import ChatRoom from "../models/chatroom.js";
import User from "../models/user.js";
const chatRoomRouter = Router();

chatRoomRouter.get("/", async (req, res) => {
  try {
    const chatrooms = await ChatRoom.find({});
    res.status(200).json(chatrooms);
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

    // Fetch the chatrooms where the user is a member
    const chatrooms = await ChatRoom.find({ members: { $in: [id] } });

    // Map the chatrooms to the desired format
    const chatHistory = chatrooms.map(async (chatroom) => {
      const otherUserId = chatroom.members.find(
        (member) => member.toString() !== id
      );
      const otherUser = (await User.findById(otherUserId)) ?? undefined;
      const isGroupChat = chatroom.isGroupChat;
      const chatName = isGroupChat
        ? chatroom.groupChatName
        : otherUser.username;
      const chatImageURL = isGroupChat
        ? chatroom.groupChatPicture
        : otherUser.imageURL;

      return {
        id: chatroom._id,
        isGroupChat: isGroupChat,
        name: chatName,
        imageURL: chatImageURL,
      };
    });

    res.status(200).json(chatHistory);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chat history",
    });
  }
});

chatRoomRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatroom = await ChatRoom.findById(id);
    res.status(200).json(chatroom);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

chatRoomRouter.get("/search/:chatroomName", async (req, res) => {
  try {
    const { chatroomName } = req.params;
    const chatrooms = await ChatRoom.find({
      name: chatroomName,
    });
    res.status(200).json(chatrooms);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatrooms",
    });
  }
});

chatRoomRouter.post("/", async (req, res) => {
  const { id, chatName, createdAt, isGroupChat, ChatPicture } = req.body;

  const existingChat = await ChatRoom.findById(id);
  if (existingChat) {
    return res.status(400).json({
      error: "Chatroom already exists",
    });
  }
  try {
    const newChatroom = new ChatRoom(req.body);
    await newChatroom.save();

    res.status(201).json(newChatroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to create chatroom",
    });
  }
});

chatRoomRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatroom = await ChatRoom.findById(id);
    res.status(200).json(chatroom);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

chatRoomRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedChatroom = await ChatRoom.findByIdAndDelete(id);
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
