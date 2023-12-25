import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import Chatroom from "../models/chatroom.js";
const chatroomRouter = Router();

chatroomRouter.get("/", async (req, res) => {
  try {
    const { chatroomTitle } = req.query;
    const chatroom = await Chatroom.findOne({
      title: chatroomTitle,
    });
    if (chatroom) res.status(200).json(chatroom);
    else res.status(400).json({ error: "Chatroom does not exist" });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom",
    });
  }
});

chatroomRouter.get("/", async (req, res) => {
  try {
    const chatrooms = await Chatroom.find({});
    res.status(200).json(chatrooms);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatrooms",
    });
  }
});

chatroomRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chatroom = await Chatroom.findById(id);
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
  body("name")
    .notEmpty()
    .withMessage("Chatroom name is required")
    .trim()
    .escape(),
  body("imageURL").optional().trim().escape(),
];

chatroomRouter.post(
  "/",
  craeteChatValidatioRules,
  validate,
  async (req, res) => {
    const { members, name, imageURL, createdAt, lastUpdatedAt } = req.body;
    try {
      const newChatroom = new Chatroom(req.body);
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

chatroomRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { fieldToUpdate, updatedValue } = req.query;
  const validFields = Object.keys(Chatroom.schema.obj);
  if (!id)
    return res
      .status(400)
      .json({ message: "id parameter is null or undefined" });
  if (!validFields.includes(fieldToUpdate)) {
    return res.status(400).json({ message: `Invalid field: ${fieldToUpdate}` });
  }
  try {
    const chatroom = await Chatroom.findByIdAndUpdate(
      id,
      { [fieldToUpdate]: updatedValue },
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    res.json({ success: true, data: chatroom });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

chatroomRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedChatroom = await Chatroom.findByIdAndDelete(id);
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

export default chatroomRouter;
