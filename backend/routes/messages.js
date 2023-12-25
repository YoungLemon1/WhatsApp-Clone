import { Router } from "express";
import { body } from "express-validator";
import { configDotenv } from "dotenv";
import validate from "./validation/valdiate.js";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Chatroom from "../models/chatroom.js";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";

configDotenv();

const messageRouter = Router();
const SYSTEM_ID = process.env.SYSTEM_ID;
const systemObjectId = new mongoose.Types.ObjectId(SYSTEM_ID);

messageRouter.get("/", async (req, res) => {
  try {
    const { chatId, chatStrObjectId } = req.query;

    let isChatroom;
    let messages;

    // Fetch the messages between the logged-in user and the other user
    if (chatId.length > 24) {
      const conversation = await Conversation.findById(chatStrObjectId);

      if (conversation) {
        isChatroom = false;
        messages = await Message.find({
          conversation: conversation._id,
        }).sort({ createdAt: 1 });
      } else {
        res.status(400).json({ error: "Invalid chat id" });
      }
    } else {
      const chatroom = await Chatroom.findById(chatId);
      if (chatroom) {
        isChatroom = true;
        messages = await Message.find({
          chatroom: chatroom._id,
        })
          .sort({ createdAt: 1 })
          .populate({ path: "sender", select: "username imageURL role" });
      } else {
        res.status(400).json({ error: "Invalid chat id" });
      }
    }
    // Retrieve the user objects for the logged-in user and the other user
    res.status(200).json({ isChatroom, messages });
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

messageRouter.get("/user-chat-history", async (req, res) => {
  try {
    const { userId } = req.query;

    const SYSTEM_ID = process.env.SYSTEM_ID;
    const systemObjectId = new mongoose.Types.ObjectId(SYSTEM_ID);

    const aggregateInteractions = async (collection, type, idField) => {
      const pipeline = [
        { $match: { members: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: idField,
            as: "messages",
          },
        },
        { $unwind: "$messages" },
        { $sort: { "messages.createdAt": -1 } },
        {
          $group: {
            _id: `$_id`,
            members: { $first: "$members" },
            lastMessage: { $first: "$messages" },
            firstSystemMessage: {
              $first: {
                $cond: [
                  { $eq: ["$messages.sender", systemObjectId] },
                  "$messages",
                  null,
                ],
              },
            },
            firstHumanMessage: {
              $first: {
                $cond: [
                  { $ne: ["$messages.sender", systemObjectId] },
                  "$messages",
                  null,
                ],
              },
            },
          },
        },
        {
          $project: {
            type: type,
            members: 1,
            lastMessage: "$lastMessage",
            sortingMessage: {
              $ifNull: [
                "$firstHumanMessage",
                {
                  $ifNull: ["$firstSystemMessage", "$lastMessage"],
                },
              ],
            },
          },
        },
      ];

      // Additional lookup for Conversations to get the user details
      if (type === "conversation") {
        pipeline.push({
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "usersDetails",
          },
        });
      }

      return collection.aggregate(pipeline);
    };

    const userConversationInteractions = await aggregateInteractions(
      Conversation,
      "conversation",
      "conversation"
    );
    const userChatroomInteractions = await aggregateInteractions(
      Chatroom,
      "chatroom",
      "chatroom"
    );

    const userInteractions = [
      ...userConversationInteractions,
      ...userChatroomInteractions,
    ];

    // ... (rest of the code)

    // Sort user interactions by the creation date of the sorting message in descending order
    userInteractions.sort(
      (a, b) => b.sortingMessage.createdAt - a.sortingMessage.createdAt
    );

    const chatHistoryPromises = userInteractions.map(async (interaction) => {
      const lastMessage = interaction.lastMessage;
      const isGroupChat = interaction.type === "chatroom";
      const members = interaction.members;
      let interactionID = null;
      let strObjectId = null;
      let title = null;
      let imageURL = null;
      if (!isGroupChat) {
        const conversation = userConversationInteractions.find((conversation) =>
          conversation._id.equals(interaction.lastMessage.conversation)
        );
        const otherUser = conversation.usersDetails.find(
          (member) => member._id.toString() != userId
        );
        const sortedMemberIds = conversation.usersDetails
          .map((member) => member._id.toString())
          .sort();
        const conversationId = sortedMemberIds.reduce(
          (acc, member) => acc + member,
          ""
        );

        interactionID = conversationId;
        strObjectId = conversation._id.toString();
        title = otherUser.username;
        imageURL = otherUser.imageURL;
      } else {
        const chatroom = await Chatroom.findById(interaction._id);
        interactionID = chatroom._id;
        strObjectId = interactionID;
        title = chatroom.title;
        imageURL = chatroom.imageURL;
      }

      return {
        id: interactionID,
        strObjectId,
        title,
        members,
        imageURL,
        isGroupChat,
        lastMessage: {
          id: lastMessage._id,
          sender: lastMessage.sender,
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
        },
      };
    });

    const chatHistory = await Promise.all(chatHistoryPromises);

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

const getChat = (conversationId, chatroomId) =>
  conversationId
    ? Conversation.findById(conversationId)
    : Chatroom.findById(chatroomId);

messageRouter.post(
  "/",
  createMessageValidationRules,
  validate,
  async (req, res) => {
    try {
      const { sender, conversation, chatroom } = req.body;
      const newMessage = new Message(req.body);
      const userSender = User.findById(sender);
      const chat = getChat(conversation, chatroom);
      if (userSender && chat) await newMessage.save();
      else if (!userSender) res.status(400).json({ error: "invalid user id" });
      else res.status(400).json({ error: "invalid chat id" });

      const responseMessage = {
        ...newMessage.toObject(),
        isHumanSender: !newMessage.sender.equals(systemObjectId),
      };
      res.status(201).json({ data: responseMessage, success: true });
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
    res.status(200).json({
      success: "message deleted successfully",
      data: deletedMessages,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

messageRouter.delete("/non-system", async (req, res) => {
  try {
    const deletedMessages = await Message.deleteMany({
      sender: { $ne: systemObjectId },
    });
    res.status(200).json({
      success: "message deleted successfully",
      data: deletedMessages,
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
