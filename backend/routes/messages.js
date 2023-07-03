import { Router } from "express";
import { body } from "express-validator";
import validate from "./validation/valdiate.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import Chatroom from "../models/chatroom.js";
const messageRouter = Router();

messageRouter.get("/", async (req, res) => {
  try {
    const { userID, otherUserID } = req.query;

    // Fetch the conversation between the logged-in user and the other user
    let conversation = await Message.find({
      $or: [
        { sender: userID, recipient: otherUserID, chatroom: null },
        { sender: otherUserID, recipient: userID, chatroom: null },
      ],
    });

    if (conversation.length > 1) {
      conversation = conversation.sort((a, b) => a.createdAt - b.createdAt);
    }

    // Retrieve the user objects for the logged-in user and the other user

    res.status(200).json(conversation);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error:
        "Internal server error: Failure fetching user-to-user conversation",
    });
  }
});

messageRouter.get("/", async (req, res) => {
  try {
    const { chatroomID } = req.query;

    // Fetch the conversation inside the chatroom
    let conversation = await Message.find({
      chatroom: chatroomID,
    });

    if (conversation.length > 1) {
      conversation = conversation.sort((a, b) => a.createdAt - b.createdAt);
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching chatroom conversation",
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
    console.log("user id", userID);
    // Match messages for the user where recipient or sender is the user
    const userInteractions = await Message.aggregate([
      {
        $match: {
          $or: [{ recipient: userID }, { sender: userID }],
        },
      },
      // Group messages by the other user or chatroom
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$chatroom", null] },
              then: {
                $cond: {
                  if: { $eq: ["$sender", userID] },
                  then: "$recipient",
                  else: "$sender",
                },
              },
              else: "$chatroom",
            },
          },
          lastMessage: { $last: "$$ROOT" },
        },
      },
      // Sort the messages by createdAt in descending order
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    // Fetch additional details for other users or chatrooms
    const interactionIds = userInteractions.map(
      (interaction) => interaction._id
    );
    const [otherUsers, chatrooms] = await Promise.all([
      User.find({ _id: { $in: interactionIds } }),
      Chatroom.find({ _id: { $in: interactionIds } }),
    ]);

    // Create the final chat history array
    const chatHistory = userInteractions.map((interaction) => {
      const lastMessage = interaction.lastMessage;
      const isGroupChat = lastMessage.chatroom !== null;

      if (!isGroupChat) {
        const otherUserID = lastMessage.sender.equals(userID)
          ? lastMessage.recipient
          : lastMessage.sender;
        const otherUser = otherUsers.find((user) =>
          user._id.equals(otherUserID)
        );
        return {
          id: otherUserID,
          name: otherUser.username,
          imageURL: otherUser.imageURL,
          lastMessage: {
            id: lastMessage._id,
            sender: lastMessage.sender,
            message: lastMessage.message,
            createdAt: lastMessage.createdAt,
          },
        };
      } else {
        const chatroom = chatrooms.find((room) =>
          room._id.equals(interaction._id)
        );
        return {
          id: chatroom._id,
          name: chatroom.name,
          imageURL: chatroom.imageURL,
          lastMessage: {
            id: lastMessage._id,
            sender: lastMessage.sender,
            message: lastMessage.message,
            createdAt: lastMessage.createdAt,
          },
        };
      }
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

function chatroomOrRecipient() {}

const createMessageValidationRules = [
  body("sender").notEmpty().withMessage("Sender is required").trim().escape(),
  body("message")
    .notEmpty()
    .withMessage("Cannot send empty messages")
    .trim()
    .escape(),
  body("createdAt").optional().isDate().withMessage("Invalid date"),
  body().custom((value, { req }) => {
    const { recipient, chatroom } = req.body;
    if ((recipient && chatroom) || (!recipient && !chatroom)) {
      throw new Error(
        "Message target undefined: message must include either recipient or chatroom id"
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
    const { sender, recipient, chatroom, message, createdAt } = req.body;
    try {
      const newMessage = new Message(req.body);
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
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

export default messageRouter;
