import { Router } from "express";
import { body } from "express-validator";
import { configDotenv } from "dotenv";
import validate from "./validation/valdiate.js";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Chatroom from "../models/chatroom.js";
import Conversation from "../models/conversation.js";

configDotenv();

const messageRouter = Router();
const SYSTEM_ID = process.env.SYSTEM_ID;
const systemObjectId = new mongoose.Types.ObjectId(SYSTEM_ID);
messageRouter.get("/", async (req, res) => {
  try {
    const { chatId, chatStrObjectId } = req.query;

    let isChatroom;
    let members;
    let messages;

    // Fetch the messages between the logged-in user and the other user
    if (chatId.length > 24) {
      const conversation = await Conversation.findById(chatStrObjectId);

      if (conversation) {
        isChatroom = false;
        members = conversation.members;
        messages = await Message.find({
          conversation: conversation._id,
        }).sort({ createdAt: 1 });
      } else {
        res.status(400).json({ error: "Invalid chat id" });
      }
    } else {
      const chatroomm = await Chatroom.findById(chatId);
      if (chatroomm) {
        isChatroom = true;
        members = chatroomm.members;
        messages = await Message.find({
          chatroom: chatroomm._id,
        })
          .sort({ createdAt: 1 })
          .populate({ path: "sender", select: "username imageURL role" });
      } else {
        res.status(400).json({ error: "Invalid chat id" });
      }
    }
    // Retrieve the user objects for the logged-in user and the other user
    res.status(200).json({ isChatroom, members, messages });
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
    console.log("user id", userId);

    const SYSTEM_ID = process.env.SYSTEM_ID;
    const systemObjectId = new mongoose.Types.ObjectId(SYSTEM_ID);

    const userConversations = await Conversation.find({
      members: { $in: [userId] },
    }).populate({ path: "members", select: "username imageURL" });

    const userChatrooms = await Chatroom.find({ members: { $in: [userId] } });

    const aggregateInteractions = async (collection, type, idField) => {
      return collection.aggregate([
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
      ]);
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

    console.log("user conversations", userConversationInteractions);
    console.log("user chatrooms", userChatroomInteractions);
    const userInteractions = [
      ...userConversationInteractions,
      ...userChatroomInteractions,
    ];

    // Sort user interactions by the creation date of the sorting message in descending order
    userInteractions.sort(
      (a, b) => b.sortingMessage.createdAt - a.sortingMessage.createdAt
    );

    console.log("User interactions", userInteractions);

    // Create the final chat history array
    //console.log("user interactions", userInteractions);
    const chatHistory = userInteractions.map((interaction) => {
      const lastMessage = interaction.lastMessage;
      const isGroupChat = interaction.type === "chatroom";
      let interactionID = null;
      let strObjectId = null;
      let title = null;
      let imageURL = null;
      if (!isGroupChat) {
        console.log("crash");
        const conversation = userConversations.find((conversation) =>
          conversation._id.equals(interaction.lastMessage.conversation)
        );
        console.log("after crash");
        const otherUser = conversation.members.find(
          (member) => member._id.toString() != userId
        );
        const sortedMemberIds = conversation.members
          .map((member) => member._id.toString())
          .sort();
        const conversationId = sortedMemberIds.reduce(
          (acc, member) => acc + member,
          ""
        );
        console.log("conversation id:", conversationId);

        interactionID = conversationId;
        strObjectId = conversation._id.toString();
        title = otherUser.username;
        imageURL = otherUser.imageURL;
      } else {
        const chatroom = userChatrooms.find((room) =>
          room._id.equals(interaction.lastMessage.chatroom)
        );
        interactionID = chatroom._id.toString();
        strObjectId = interactionID;
        title = chatroom.title;
        imageURL = chatroom.imageURL;
      }

      return {
        id: interactionID,
        strObjectId,
        title,
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
    try {
      const newMessage = new Message(req.body);
      await newMessage.save();

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
