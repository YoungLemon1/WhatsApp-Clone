import React, { useEffect, useState, useRef, useCallback } from "react";
import Axios from "axios";
import uuid from "uuid4";
import ScrollableFeed from "react-scrollable-feed";
import { API_URL } from "../constants";

function Chat({
  currentChat,
  setCurrentChat,
  socket,
  loggedUser,
  chatHistory,
  setChatHistory,
  dateFormat,
}) {
  const [messages, setMessages] = useState([]);
  const [currentMessageContent, setCurrentMessageContent] = useState("");
  const [loading, setLoading] = useState(true);

  //const [newMessages, setNewMessages] = useState(false);
  const userId = useRef(loggedUser._id);
  //const prevLastMessage = useRef(chat.lastMessage);
  const messagePayloadValid = (messagePayload) =>
    messagePayload.sender &&
    messagePayload.message &&
    (messagePayload.conversation || messagePayload.chatroom) &&
    !(messagePayload.conversation && messagePayload.chatroom) &&
    typeof messagePayload.sender === "string" &&
    typeof messagePayload.message === "string" &&
    (typeof messagePayload.conversation === "string" ||
      typeof messagePayload.chatroom === "string");

  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const updateCurrentChatLastMessage = useCallback(
    (message) => {
      setCurrentChat((prevChat) => ({
        ...prevChat,
        lastMessage: message,
      }));
    },
    [setCurrentChat]
  );

  const updateCurrentChatStrObjId = useCallback(
    (strObjectId) => {
      setCurrentChat((prevChat) => ({
        ...prevChat,
        strObjectId,
      }));
    },
    [setCurrentChat]
  );
  //#region lifecycle functions
  useEffect(() => {
    // Update the ref every time currentChat changes

    const fetchMessages = async () => {
      try {
        const res = await Axios.get(
          `${API_URL}/messages?chatId=${currentChat.id}&chatStrObjectId=${currentChat.strObjectId}`
        );
        setMessages(res.data.messages);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch messages", error);
        setLoading(false);
      }
    };

    // Only fetch messages if it's not a new chat
    if (!currentChat.new) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [currentChat, loggedUser._id]); // Depends on currentChat and loggedUser._id

  useEffect(() => {
    // Add the event listener for receiving messages
    const handleReceiveMessage = (message) => {
      console.log("meesage received", message);
      console.log("current chat", currentChat);
      addMessage(message);
      updateCurrentChatLastMessage(message);
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, updateCurrentChatLastMessage, currentChat]);

  // Clean up the event listener when the component unmounts

  useEffect(() => {
    // Add the event listener for receiving messages
    const handleUpdateNewChat = (chatStrObjectId) => {
      updateCurrentChatStrObjId(chatStrObjectId);
      console.log("chat new strObjId received:", chatStrObjectId);
    };

    socket.on("update_new_chat", handleUpdateNewChat);
    return () => {
      socket.off("update_new_chat", handleUpdateNewChat);
    };
  }, [socket, updateCurrentChatStrObjId]);

  //#endregion

  //#region Server request functions

  async function createConversation() {
    try {
      const res = await Axios.post(`${API_URL}/conversations`, {
        members: currentChat.members,
      });
      const data = res.data;
      console.log("User conversation created", data);
      return data._id;
    } catch (err) {
      console.error("Failed to create conversation", err);
      alert("Failed to create a new conversation. Please try again.");
    }
  }

  async function createAndEmitMessage(
    message,
    currentStrObjectId,
    senderProfileData,
    chatProfileData
  ) {
    try {
      const res = await Axios.post(
        `${API_URL}/messages`,
        message,
        currentStrObjectId
      );
      const data = res.data;
      socket.emit(
        "send_message",
        data.data,
        senderProfileData,
        chatProfileData,
        currentChat.id,
        currentStrObjectId,
        currentChat.members,
        currentChat.isGroupChat
      );
      return data;
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Server Error: request failed. Please try again later");
    }
  }

  async function updateLastMessage(currentStrObjectId, lastMessageId) {
    try {
      console.log("Is group chat", currentChat.isGroupChat);
      const chatType = !currentChat.isGroupChat ? "conversations" : "chatrooms";
      const res = await Axios.patch(
        `${API_URL}/${chatType}/${currentStrObjectId}?fieldToUpdate=lastMessage&updatedValue=${lastMessageId}`
      );
      console.log("Chat updated:", res.data.success, res.data.data);
      return res.data.success;
    } catch (err) {
      console.error("Failed to update chat", err);
    }
  }

  //#endregion

  //#region UI Updates
  // updates the chat resets the current message content.
  async function updateUIAfterSendMessage(newMessage) {
    setCurrentMessageContent("");
    await setCurrentChat((prevChat) => ({
      ...prevChat,
      lastMessage: newMessage,
    }));
    // Replace the last message (optimistic update) with the one from the server
    setMessages((prevMessages) => {
      return prevMessages.map((message, index) =>
        index === prevMessages.length - 1 ? newMessage : message
      );
    });
  }

  // In case of an error, rolls back the UI to its previous state.
  function rollbackUIAfterFailedMessage(prevLastMessage, prevChatHistory) {
    setCurrentMessageContent(currentMessageContent);
    setCurrentChat((prevChat) => ({
      ...prevChat,
      lastMessage: prevLastMessage,
    }));
    setMessages((prevMessages) => [...prevMessages.slice(0, -1)]);
    setChatHistory((prevChatHistory) => [...prevChatHistory]);
  }
  //#endregion

  // Main function to send a message and update UI accordingly.
  async function sendMessage() {
    const chatType = !currentChat.isGroupChat ? "conversation" : "chatroom";

    let currentStrObjectId = currentChat.strObjectId;

    // If it's not a group chat and is the first message, doesn't have an ObjectId:
    if (
      !currentChat.isGroupChat &&
      !currentStrObjectId &&
      messages.length === 0
    ) {
      currentStrObjectId = await createConversation();
      if (!currentStrObjectId) {
        console.error("Failed to create conversation.");
        return; // Exit the function if there's no conversationId
      }
      updateCurrentChatStrObjId(currentStrObjectId);
      socket.emit("new_chat", currentChat.id, currentStrObjectId);
    }

    const messagePayload = {
      sender: userId.current,
      message: currentMessageContent,
      [chatType]: currentStrObjectId,
    };

    if (!messagePayloadValid(messagePayload)) {
      setCurrentMessageContent(currentMessageContent);
      console.error(
        "Create message failed: Invalid message base object",
        messagePayload
      );
      return;
    }

    console.log("message payload", messagePayload);

    // Save the previous state in case we need to rollback
    const prevLastMessage = currentChat.lastMessage;
    const prevChatHistory = [...chatHistory];

    // Optimistically update UI with the new message
    setMessages((prevMessages) => [...prevMessages, messagePayload]);

    const senderProfileData = {
      title: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };

    const chatProfileData = {
      title: currentChat.title,
      imageURL: currentChat.imageURL,
    };

    console.log("chat members exists", !!currentChat.members);

    const responseData = await createAndEmitMessage(
      messagePayload,
      currentStrObjectId,
      senderProfileData,
      chatProfileData
    );

    if (responseData && responseData.success) {
      const newMessage = responseData.data;
      updateUIAfterSendMessage(newMessage);
      updateCurrentChatLastMessage(newMessage);
      await updateLastMessage(currentStrObjectId, newMessage._id);
      console.log("message created", newMessage);
    } else {
      rollbackUIAfterFailedMessage(prevLastMessage, prevChatHistory);
    }
  }

  //#region styling and displaying message functions
  function setMessageClassName(message) {
    const senderObjectId = message.sender._id;
    let senderId = senderObjectId ? senderObjectId.toString() : message.sender;
    let msgString = "message";
    if (message.sender.username === "SYSTEM") {
      return `${msgString} system`;
    }
    return `${msgString} ${
      senderId === loggedUser._id.toString() ? "current-user" : "other-user"
    }`;
  }

  function setMessageHeader(message) {
    const senderObjectId = message.sender._id;
    const senderId = senderObjectId
      ? senderObjectId.toString()
      : message.sender;
    const senderUsername = message.sender.username;
    return senderId !== loggedUser._id.toString() && senderUsername !== "SYSTEM"
      ? senderUsername
      : "";
  }

  function setMessageDate(message) {
    if (currentChat.isGroupChat && message.sender.username === "SYSTEM")
      return null;
    return dateFormat(message.createdAt);
  }
  //#endregion

  function mapMessages() {
    return messages.map((message) => {
      const msg_uuid = uuid();
      return (
        <div className="message-container" key={msg_uuid}>
          <div className={setMessageClassName(message)}>
            <p>{currentChat.isGroupChat ? setMessageHeader(message) : ""}</p>
            <p>{message.message}</p>
            <small>{setMessageDate(message)}</small>
          </div>
        </div>
      );
    });
  }

  async function exitChat() {
    if (currentChat.new) {
      setCurrentChat((prevChat) => ({
        ...prevChat,
        new: undefined,
      }));
    }
    console.log("chat id" + currentChat.id);
    await socket.emit("leave_room", currentChat.id);
    setCurrentChat(null);
    console.log("chat id" + currentChat.id);
    console.log(`${loggedUser.username} exited chat ${currentChat.id}`);
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="exit-btn" onClick={exitChat}>
          ←
        </button>
        <img
          className="profile-img"
          src={currentChat.imageURL}
          alt="chat profile"
        ></img>
        <h4 className="chat-name">
          {currentChat.title ?? "Error: undefined chat"}
        </h4>
      </div>
      <div className="chat-body">
        {loading ? (
          <p className="loading">loading chat messages...</p>
        ) : (
          <ScrollableFeed>{mapMessages()}</ScrollableFeed>
        )}
      </div>
      <div className="chat-footer">
        <input
          id="message-text"
          className="message-text"
          placeholder="Send a message"
          value={currentMessageContent}
          onChange={(event) => {
            setCurrentMessageContent(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && currentMessageContent !== "") {
              sendMessage();
            }
          }}
        ></input>
        <button
          className="send-btn"
          disabled={currentMessageContent === ""}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;
