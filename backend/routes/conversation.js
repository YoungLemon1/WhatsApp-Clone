import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";
const conversationRouter = Router();

conversationRouter.get("/", async (req, res) => {
  try {
    const { username } = req.query;
    const otherUser = await User.findOne({ username: username });
    if (!otherUser) {
      return res.status(400).json({ error: "Invalid username" });
    }
    const conversation = await Conversation.findOne({
      $in: { members: otherUser._id },
    });
    res.status(200).json(conversation);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching coversation",
    });
  }
});

conversationRouter.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({});
    res.status(200).json(conversations);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching coversations",
    });
  }
});

conversationRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    res.status(200).json(conversation);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching coversations",
    });
  }
});

const arrayNotEmpty = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Empty array error");
  }
  return true;
};

const craeteCoversationValidatioRules = [
  body("members")
    .custom(arrayNotEmpty)
    .withMessage("Coversation cannot be without members")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coversation must have exactly 2 members"),
  body("createdAt").optional().isDate().withMessage("Invalid date"),
  body("lastUpdatedAt").optional().isDate().withMessage("Invalid date"),
];

conversationRouter.post(
  "/",
  craeteCoversationValidatioRules,
  validate,
  async (req, res) => {
    const { members, createdAt, lastUpdatedAt } = req.body;

    const existingConversations = await Conversation.find();
    if (
      Array.isArray(existingConversations) ||
      existingConversations.length !== 0
    ) {
      return res.status(400).json({
        error: "Conversation already exists",
      });
    }
    try {
      const newConversation = new Conversation(req.body);
      await newConversation.save();

      res.status(201).json(newConversation);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        error: "Internal server error: failed to create conversation",
      });
    }
  }
);

conversationRouter.patch(
  "/:id",
  craeteCoversationValidatioRules,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await Conversation.findById(id);
      res.status(200).json(conversation);
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