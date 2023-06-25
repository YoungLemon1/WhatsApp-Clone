import { Router } from "express";
import { body } from "express-validator";
import Message from "../models/message.js";
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

messageRouter.post("/", [body("message").notEmpty()], async (req, res) => {
  const { sender, chatroom, message, createdAt } = req.body;
  const errors = Message.schema.validate(message);
  if (errors) {
    res.status(400).json({ error: "Invalid message schema", data: errors });
    throw new Error(errors.map((error) => error.message).join(", "));
  }
  try {
    const newMessage = new Message(req.body);
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
