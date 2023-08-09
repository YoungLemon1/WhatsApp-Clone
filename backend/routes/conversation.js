import { Router } from "express";
import { body } from "express-validator";
import mongoose from "mongoose";
import validate from "./validation/valdiate.js";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";
const conversationRouter = Router();

conversationRouter.get("/", async (req, res) => {
  try {
    const { currentUserId, otherUserUsername } = req.query;
    const otherUser = await User.findOne({ username: otherUserUsername });
    if (!otherUser) {
      return res.status(400).json({ error: "Invalid username" });
    }
    const otherUserId = otherUser._id.toString();
    const members = [currentUserId, otherUserId];
    const conversation = await Conversation.findOne({
      $in: { members: { $all: members } },
    });
    if (conversation) res.status(200).json(conversation);
    else res.status(400).json({ error: "Conversation does not exist" });
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

conversationRouter.get("/usernames", async (req, res) => {
  try {
    const conversations = await Conversation.find({}).populate({
      path: "members",
      select: "username",
    });
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

conversationRouter.get("/otherUser", async (req, res) => {
  try {
    const { loggedUserId, conversationId } = req.query;
    const conversation = await Conversation.findById(conversationId).populate(
      "members"
    );
    const otherUser = conversation.members.find(
      (member) => !member._id.equals(loggedUserId)
    );
    res
      .status(200)
      .json({ title: otherUser.username, imageURL: otherUser.imageURL });
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
    const { members } = req.body;
    try {
      const existingConversation = await Conversation.findOne({
        members: { $all: [...members] },
      });
      if (existingConversation) {
        res.status(400).json("error: conversation already exists");
      }
      const newConversation = new Conversation({
        members,
      });
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

conversationRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { fieldToUpdate, updatedValue } = req.query;
  const validFields = Object.keys(Conversation.schema.obj);
  if (!validFields.includes(fieldToUpdate)) {
    return res.status(400).json({ message: `Invalid field: ${fieldToUpdate}` });
  }
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { [fieldToUpdate]: updatedValue },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

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

conversationRouter.delete("/", async (req, res) => {
  try {
    const deletedChatroom = await Conversation.deleteMany({});
    res.status(200).json({
      success: "chatroom deleted successfully",
      data: deletedChatroom,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete chatroom",
    });
  }
});

export default conversationRouter;
