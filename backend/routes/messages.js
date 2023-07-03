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
    console.log(userID);

    // Fetch the chatrooms where the user is a member
    const userMessages = await Message.find({
      $or: [
        { sender: userID, chatroom: null },
        { recipient: userID, chatroom: null },
      ],
    });
    // Map the chatrooms to the desired format
    const otherUsersIDs = [
      ...new Set(
        userMessages.map((message) => {
          const otherUserID = message.sender.equals(userID)
            ? message.recipient
            : message.sender;
          return otherUserID.toString();
        })
      ),
    ];

    const otherUsers = await User.find({ _id: { $in: otherUsersIDs } });

    const otherUsersMap = otherUsers.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    console.log("other users", otherUsersIDs);

    // An array of last messages between the user and another user
    const conversationLastMessages = otherUsersIDs.map((otherUser) => {
      const conversation = userMessages.filter(
        (message) =>
          message.recipient.equals(otherUser) ||
          message.sender.equals(otherUser)
      );
      const lastMessage = conversation.reduce((latest, message) => {
        if (!latest || message.createdAt > latest.createdAt) {
          return message;
        }
        return latest;
      }, null);
      return lastMessage;
    });

    const userChatrooms = await Chatroom.find({ members: { $in: [userID] } });
    const chatroomLastMessages = await Message.find({
      _id: {
        $in: userChatrooms
          .map((chatroom) => chatroom.lastMessage)
          .filter((lastMessage) => lastMessage !== undefined),
      },
    });

    const chatroomsMap = userChatrooms.reduce((map, chatroom) => {
      map[chatroom._id] = chatroom;
      return map;
    }, {});

    //All last messages in user to user conversation or in chatroom sorted in descending order
    const lastMessages = [
      ...conversationLastMessages,
      ...chatroomLastMessages,
    ].sort((a, b) => b.createdAt - a.createdAt);

    // Modify the chatHistory mapping to use the userMap
    const chatHistory = lastMessages.map((lastMessage) => {
      const messageID = lastMessage._id;
      const sender = lastMessage.sender;
      const messageContent = lastMessage.message;
      const createdAt = lastMessage.createdAt;
      const isGroupChat = lastMessage.chatroom != null;

      if (!isGroupChat) {
        const otherUserID = lastMessage.sender.equals(userID)
          ? lastMessage.recipient
          : lastMessage.sender;
        const otherUser = otherUsersMap[otherUserID];
        return {
          id: otherUserID,
          name: otherUsersMap[otherUserID].username,
          imageURL: otherUsersMap[otherUserID].imageURL,
          lastMessage: {
            id: messageID,
            sender: sender,
            message: messageContent,
            createdAt: lastMessage.createdAt,
          },
        };
      } else {
        const chatroomID = lastMessage.chatroom;
        const chatroom = chatroomsMap[chatroomID];
        return {
          id: chatroomID,
          name: chatroom.name,
          imageURL: chatroom.imageURL,
          lastMessage: {
            id: messageID,
            sender: sender,
            message: messageContent,
            createdAt: createdAt,
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
  body("createdAt").notEmpty().isDate().withMessage("Invalid date"),
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
