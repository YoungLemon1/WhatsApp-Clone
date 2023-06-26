import { Router } from "express";
import { body } from "express-validator";
import Message from "../models/message.js";
import User from "../models/user.js";
import Chatroom from "../models/chatroom.js";
const messageRouter = Router();

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

messageRouter.get("/chat-history/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    // Fetch the chatrooms where the user is a member
    const userMessages = await Message.find({
      $or: [
        { sender: userID, chatroom: null },
        { recipient: userID, chatroom: null },
      ],
    });
    console.log(userID);
    console.log("user messages", userMessages);
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
      console.log("conversation", conversation);
      const lastMessage = conversation.reduce((latest, message) => {
        console.log("message", message);
        if (!latest || message.createdAt > latest.createdAt) {
          return message;
        }
        return latest;
      }, null);
      return lastMessage;
    });

    console.log("Last convo messages", conversationLastMessages);

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

    console.log("chatrooms map", chatroomsMap);

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
      console.log("message", lastMessage);
      if (!isGroupChat) {
        const otherUserID = lastMessage.sender.equals(userID)
          ? lastMessage.recipient
          : lastMessage.sender;
        const otherUser = otherUsersMap[otherUserID];
        return {
          id: otherUserID,
          name: otherUsersMap[otherUserID].username,
          imageURL: otherUsersMap[otherUserID].imageURL,
          isGroupChat: isGroupChat,
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
          members: chatroom.members,
          name: chatroom.name,
          imageURL: chatroom.imageURL,
          isGroupChat: isGroupChat,
          lastMessage: {
            id: messageID,
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

messageRouter.get("/conversation/:userID/:otherUserID", async (req, res) => {
  try {
    const { userID, otherUserID } = req.params;

    // Fetch the conversation between the logged-in user and the other user
    const conversation = await Message.find({
      $or: [
        { sender: userID, recipient: otherUserID, chatroom: null },
        { sender: otherUserID, recipient: userID, chatroom: null },
      ],
    });

    if (conversation.length > 1) {
      conversation = conversation.sort((a, b) => a.createdAt - b.createdAt);
    }

    console.log(conversation);

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

messageRouter.get("/conversation/:chatroomID", async (req, res) => {
  try {
    const { chatroomID } = req.params;

    // Fetch the conversation inside the chatroom
    const conversation = await Message.find({
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

messageRouter.post("/", [body("message").notEmpty()], async (req, res) => {
  const { sender, recipient, chatroom, message, createdAt } = req.body;
  if (!sender) {
    res.status(400).json({ error: "No sender" });
    return;
  }
  if ((recipient && chatroom) || (!recipient && !chatroom)) {
    res.status(400).json({
      error:
        "Message target undefined: message must include either recipient or chatroom id",
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
  } catch (err) {
    console.error(err.stack);
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
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error: failed to delete message",
    });
  }
});

export default messageRouter;
