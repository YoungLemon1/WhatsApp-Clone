import { Router } from "express";
import { body } from "express-validator";
import Message from "../models/message.js";
import User from "../models/user.js";
import Chatroom from "../models/chatroom.js";
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

messageRouter.get("/conversations/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    // Fetch the chatrooms where the user is a member
    const userMessages = await Message.find({
      $or: [
        { sender: userID, chatroom: null },
        { recipient: userID, chatroom: null },
      ],
    });

    const userChatrooms = await Chatroom.find({ members: { $in: [userID] } });

    const chatroomLastMessages = await Message.find({
      _id: { $in: userChatrooms.map((chatroom) => chatroom.lastMessage) },
    });

    // Map the chatrooms to the desired format
    const otherUsersIDs = [
      ...new Set(
        userMessages.map((message) => {
          const otherUserID =
            message.sender !== userID ? message.sender : message.recipient;
          return otherUserID;
        })
      ),
    ];

    const otherUsers = await User.find({ _id: { $in: otherUsersIDs } });

    const messagesMap = userMessages.reduce((map, message) => {
      map[message._id] = message;
      return map;
    }, {});

    const otherUsersMap = otherUsers.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const chatroomsMap = userChatrooms.reduce((map, chatroom) => {
      map[chatroom._id] = chatroom;
      return map;
    }, {});

    // An array of conversations array, made of messages between the user and another user sorted in acsending order
    const conversations = otherUsersIDs.map((otherUser) => {
      return userMessages
        .filter(
          (message) =>
            message.sender === otherUser || message.recipient === otherUser
        )
        .sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    });

    const lastMessages = conversations
      .map((conversation) => {
        const lastMessage = conversation[conversation.length - 1];
        return lastMessage;
      })
      .concat(chatroomLastMessages)
      .sort({ createdAt: -1 });

    // Modify the chatHistory mapping to use the userMap
    const chatHistory = lastMessages.map((lastMessage) => {
      const lastMessageID = lastMessage._id;
      if (lastMessage.chatroom === null) {
        const otherUserID =
          lastMessage.sender !== userID
            ? lastMessage.sender
            : lastMessage.recipient;
        const otherUser = otherUsersMap[otherUserID];
        return {
          id: otherUserID,
          name: otherUser.username,
          imageURL: otherUser.imageURL,
          lastMessage: {
            id: lastMessageID,
            message: messagesMap[lastMessageID],
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
            id: lastMessageID,
            message: messagesMap[lastMessageID],
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

messageRouter.get("/conversation/:userID/:otherUserID", async (req, res) => {
  try {
    const { userID, otherUserID } = req.params;

    // Fetch the conversation between the logged-in user and the other user
    const conversation = await Message.find({
      $or: [
        { sender: userID, recipient: otherUserID, chatroom: null },
        { sender: otherUserID, recipient: userID, chatroom: null },
      ],
    }).sort({ createdAt: 1 });

    // Retrieve the user objects for the logged-in user and the other user
    const [loggedInUser, otherUser] = await Promise.all([
      User.findById(userID),
      User.findById(otherUserID),
    ]);

    const conversationWithUsers = {
      loggedInUser,
      otherUser,
      messages: conversation,
    };

    res.status(200).json(conversationWithUsers);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching conversation",
    });
  }
});

messageRouter.get("/conversation/:chatroomID", async (req, res) => {
  try {
    const { chatroomID } = req.params;

    // Fetch the conversation between the logged-in user and the other user
    const conversation = await Message.find({
      chatroom: chatroomID,
    }).sort({ createdAt: 1 });

    // Retrieve the user objects for the logged-in user and the other user

    res.status(200).json({ messages: conversation });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: Failure fetching conversation",
    });
  }
});

messageRouter.post("/", [body("message").notEmpty()], async (req, res) => {
  const { sender, recipient, chatroom, message, createdAt } = req.body;
  if (!sender) {
    res.status(400).json({ error: "No sender" });
    return;
  }
  if (!recipient && !chatroom) {
    res.status(400).json({
      error:
        "Message target undefined: message must include recipient or chatroom id",
    });
    return;
  }
  if (recipient && chatroom) {
    res.status(400).json({
      error:
        "Duplicate message type: Message cannot be sent to a user and a group at the same time",
    });
    return;
  }
  if (!message || message === "") {
    res.status(400).json({
      error: "Cannot send empty messages",
    });
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
