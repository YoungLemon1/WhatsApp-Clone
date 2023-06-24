import { Router } from "express";
import { body } from "express-validator";
import UserMessage from "../models/userMessages.js";
import ChatRoom from "../models/chatroom.js";
const messageRouter = Router();

messageRouter.get("/", async (req, res) => {
  try {
    const messages = await UserMessage.find({});
    res.status(200).json(messages);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

messageRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const message = await UserMessage.findById(id);
    res.status(200).json(message);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

messageRouter.get("/chatroom/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await UserMessage.find({ chatroom: id });
    res.status(200).json(messages);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

messageRouter.post("/", [body("text").notEmpty()], async (req, res) => {
  const { sender, chatroom, text, createdAt } = req.body;

  if (text === "") {
    return res.status(400).json({
      error: "cannot send empty messages",
    });
  }
  try {
    const newMessage = new UserMessage(req.body);
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to create message",
    });
  }
});

messageRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMessage = await UserMessage.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(400).json({
        error: "message does not exist",
      });
    }
    resres.status(200).json({
      success: "message deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

export default messageRouter;
