import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import Conversation from "../models/conversation.js";
const conversationRouter = Router();

conversationRouter.get("/", async (req, res) => {
  try {
    const { conversationName } = req.query;
    const chatrooms = await Conversation.findOne({
      name: conversationName,
    });
    res.status(200).json(chatrooms);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatrooms",
    });
  }
});

conversationRouter.get("/", async (req, res) => {
  try {
    const chatrooms = await Conversation.find({});
    res.status(200).json(chatrooms);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatrooms",
    });
  }
});

conversationRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatroom = await Conversation.findById(id);
    res.status(200).json(chatroom);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

const arrayNotEmpty = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Empty array error");
  }
  return true;
};

const craeteChatValidatioRules = [
  body("members")
    .custom(arrayNotEmpty)
    .withMessage("Chatroom cannot be without members"),
  body("name").notEmpty().withMessage("Chatroom name is required").trim(),
];

conversationRouter.post(
  "/",
  craeteChatValidatioRules,
  validate,
  async (req, res) => {
    const { id, chatName, createdAt, isGroupChat, ChatPicture } = req.body;

    const existingChat = await Conversation.findById(id);
    if (existingChat) {
      return res.status(400).json({
        error: "Chatroom already exists",
      });
    }
    try {
      const newChatroom = new Conversation(req.body);
      await newChatroom.save();

      res.status(201).json(newChatroom);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        error: "Internal server error: failed to create chatroom",
      });
    }
  }
);

const updateChatroomValidationRules = [
  body("id").notEmpty().withMessage("Chatroom ID is required"),
  body("name").notEmpty().withMessage("Chatroom name is required"),
  body("createdAt").optional().isDate().withMessage("Invalid date"),
  body("lastUpdatedAt").optional().isDate().withMessage("Invalid date"),
  // Add more validation rules as needed
];

conversationRouter.patch(
  "/:id",
  updateChatroomValidationRules,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const chatroom = await Conversation.findById(id);
      res.status(200).json(chatroom);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        error: "Internal server error: Failure fetching chatroom",
      });
    }
  }
);

conversationRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedChatroom = await Conversation.findByIdAndDelete(id);
    if (!deletedChatroom) {
      return res.status(400).json({
        error: "chatroom does not exist",
      });
    }
    res.status(200).json({
      success: "chatroom deleted successfully",
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete chatroom",
    });
  }
});

export default conversationRouter;
