import { Router } from "express";
import { body } from "express-validator";
import MessageModel from "../models/messages.js";
const messageRouter = Router();

messageRouter.get("/", async (req, res) => {
  try {
    const messages = await MessageModel.find({});
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
    const message = await MessageModel.findById(id);
    res.status(200).json(message);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

messageRouter.post("/", [body("text").notEmpty()], async (req, res) => {
  const { sender, text, createdAt } = req.body;

  // Check if username already exists in the database
  if ({ text } === "") {
    return res.status(400).json({
      error: "cannot send empty messages",
    });
  }
  try {
    const newMessage = new MessageModel(req.body);
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error: failed to create user",
    });
  }
});

messageRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMessage = await MessageModel.findByIdAndDelete(id);
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
