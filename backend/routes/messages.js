import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Chatroom from "../models/chatroom.js";
import Conversation from "../models/conversation.js";
const messageRouter = Router();

messageRouter.get("/", async (req, res) => {
  try {
    const { chatId } = req.query;

    let isGroupChat;
    let members;
    let messages;
    // Fetch the messages between the logged-in user and the other user
    const conversation = await Conversation.findById(chatId);
    const chatroomm = await Chatroom.findById(chatId);
    console.log(chatroomm);

    if (conversation) {
      isGroupChat = false;
      members = conversation.members;
      messages = await Message.find({
        conversation: new mongoose.Types.ObjectId(chatId),
      }).sort({ createdAt: 1 });
    } else if (chatroomm) {
      isGroupChat = true;
      members = chatroomm.members;
      messages = await Message.find({
        chatroom: new mongoose.Types.ObjectId(chatId),
      }).sort({ createdAt: 1 });
    } else {
      res.status(400).json({ error: "Invalid chat id" });
    }

    // Retrieve the user objects for the logged-in user and the other user
    res.status(200).json({ isGroupChat, members, messages });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chat messages",
    });
  }
});

messageRouter.get("/", async (req, res) => {
  try {
    const messages = await Message.find({});
    res.status(200).json(messages);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

messageRouter.get("/last-messages", async (req, res) => {
  try {
    const { userID } = req.query;
    //console.log("user id", userID);

    const userConversations = await Conversation.find({
      members: { $in: [userID] },
    }).populate("members");
    //console.log("conversations", userConversations);

    const userChatrooms = await Chatroom.find({ members: { $in: [userID] } });
    //console.log("chatrooms", userChatrooms);

    const userInteractions = await Message.aggregate([
      // Match messages for the user where recipient or sender is the user
      {
        $match: {
          $or: [
            {
              conversation: {
                $in: userConversations.map((conversation) => conversation._id),
              },
            },
            {
              chatroom: { $in: userChatrooms.map((chatroom) => chatroom._id) },
            },
          ],
        },
      },
      // Group messages by the other user or chatroom
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$chatroom", undefined] },
              "$chatroom",
              "$conversation",
            ],
          },
          lastMessage: { $last: "$$ROOT" },
        },
      },
      // Sort the messages by createdAt in descending order
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
      // Limit the result to the desired number of messages
      {
        $limit: 10, // Adjust the limit as per your requirement
      },
    ]);

    //console.log("last messages", userInteractions);

    // Create the final chat history array
    //console.log("user interactions", userInteractions);
    const chatHistory = userInteractions.map((interaction) => {
      const lastMessage = interaction.lastMessage;
      const isGroupChat = lastMessage.chatroom !== undefined;
      let interactionID = null;
      let interactionWith = null;
      let imageURL = null;
      if (!isGroupChat) {
        const conversation = userConversations.find((conversation) =>
          conversation._id.equals(interaction.lastMessage.conversation)
        );
        const otherUser = conversation.members.find(
          (member) => member._id.toString() != userID
        );
        interactionID = conversation._id.toString();

        interactionWith = otherUser.username;
        imageURL = otherUser.imageURL;
      } else {
        const chatroom = userChatrooms.find((room) =>
          room._id.equals(interaction.lastMessage.chatroom)
        );
        interactionID = chatroom._id.toString();
        interactionWith = chatroom.title;
        imageURL = chatroom.imageURL;
      }

      return {
        id: interactionID,
        title: interactionWith,
        imageURL,
        lastMessage: {
          id: lastMessage._id,
          sender: lastMessage.sender,
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
        },
      };
    });

    res.status(200).json(chatHistory);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching user chat history",
    });
  }
});

messageRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    res.status(200).json(message);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching messages",
    });
  }
});

const createMessageValidationRules = [
  body("sender").notEmpty().withMessage("Sender is required").trim(),
  body("message").notEmpty().withMessage("Cannot send empty messages").trim(),
  body("createdAt").optional().isDate().withMessage("Invalid date"),
  body().custom((value, { req }) => {
    const { conversation, chatroom } = req.body;
    if ((conversation && chatroom) || (!conversation && !chatroom)) {
      throw new Error(
        "Message target undefined: message must include either conversation or chatroom id"
      );
    }
    return true;
  }),
];

messageRouter.post(
  "/",
  createMessageValidationRules,
  validate,
  async (req, res) => {
    const { sender, conversation, chatroom, message } = req.body;
    try {
      const newMessage = new Message({
        sender,
        conversation,
        chatroom,
        message,
        createdAt: Date.now(),
      });
      await newMessage.save();

      res.status(201).json(newMessage);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({
        error: "Internal server error: failed to create message",
      });
    }
  }
);

messageRouter.patch("/", async (req, res) => {
  const { fieldToUpdate, updatedValue } = req.body;
  try {
    const updateResult = await Message.updateMany(
      {},
      { [fieldToUpdate]: updatedValue }
    );
    if (updateResult.nModified === 0) {
      return res.status(400).json({
        error: "No messages found to update",
      });
    }
    updateResult.forEach((doc) => {
      doc.save((saveErr) => {
        if (saveErr) {
          // Handle save error
          console.error("Failed to save document:", saveErr);
        }
      });
    });
    res.status(200).json({
      success: "Messages updated successfully",
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failed to update messages",
    });
  }
});

messageRouter.delete("/", async (req, res) => {
  try {
    const deletedMessages = await Message.deleteMany({});
    if (!deletedMessages) {
      return res.status(400).json({
        error: "no messages exist",
      });
    }
    resres.status(200).json({
      success: "message deleted successfully",
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

messageRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMessage = await Message.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(400).json({
        error: "message does not exist",
      });
    }
    resres.status(200).json({
      success: "message deleted successfully",
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

export default messageRouter;
