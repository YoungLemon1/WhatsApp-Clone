import React, { useEffect, useState, useRef, useCallback } from "react";
import Axios from "axios";
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
  const currentChatRef = useRef(currentChat);

  //const [newMessages, setNewMessages] = useState(false);
  const userId = useRef(null);
  //const prevLastMessage = useRef(chat.lastMessage);
  const messagePayloadValid = (messagePayload) =>
    messagePayload.sender &&
    messagePayload.message &&
    (messagePayload.conversation || messagePayload.chatroom) &&
    !(messagePayload.conversation && messagePayload.chatroom);

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

  useEffect(() => {
    if (
      currentChatRef.current.id !== currentChat.id ||
      currentChatRef.current.strObjectId !== currentChat.strObjectId
    ) {
      currentChatRef.current = currentChat;
    }
  }, [currentChat]);

  //#region lifecycle functions
  useEffect(() => {
    // Add the event listener for receiving messages
    const handleReceiveMessage = (message) => {
      console.log("meesage received", message);
      addMessage(message);
      updateCurrentChatLastMessage(message);
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, updateCurrentChatLastMessage]);

  // Clean up the event listener when the component unmounts

  //fetch messages
  useEffect(() => {
    userId.current = loggedUser._id;
    async function fetchMessages() {
      const res = await Axios.get(
        `${API_URL}/messages?chatId=${currentChatRef.current.id}&chatStrObjectId=${currentChatRef.current.strObjectId}`
      );
      return res.data.messages;
    }

    if (currentChatRef.current.new) {
      setLoading(false);
      return;
    }

    fetchMessages()
      .then((resMessages) => {
        console.log(resMessages);
        setMessages(resMessages);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch messages", error);
      });
  }, [loggedUser._id]);

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

  async function createAndEmitMessage(message, members, senderData) {
    /*
    if (
      !message.sender ||
      !message.message ||
      !message.conversation & !message.chatroom
    )
      alert("Failed to send the message");
    */
    try {
      const res = await Axios.post(`${API_URL}/messages`, message);
      const data = res.data;
      socket.emit(
        "send_message",
        data.data,
        members,
        senderData,
        currentChat.id
      );
      return data;
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Server Error: request failed. Please try again later");
    }
  }

  async function updateLastMessage(lastMessageId) {
    try {
      const chatType = !currentChat.isGroupChat ? "conversations" : "chatrooms";
      const res = await Axios.patch(
        `${API_URL}/${chatType}/${currentChatRef.current.strObjectId}?fieldToUpdate=lastMessage&updatedValue=${lastMessageId}`
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
    }

    const messagePayload = {
      sender: userId.current,
      message: currentMessageContent,
      [chatType]: currentStrObjectId,
    };

    if (!messagePayloadValid(messagePayload)) {
      setCurrentMessageContent(currentMessageContent);
      return;
    }

    // Save the previous state in case we need to rollback
    const prevLastMessage = currentChat.lastMessage;
    const prevChatHistory = [...chatHistory];

    // Optimistically update UI with the new message
    setMessages((prevMessages) => [...prevMessages, messagePayload]);

    const senderInfo = {
      username: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };

    const responseData = await createAndEmitMessage(
      messagePayload,
      currentChatRef.current.members,
      senderInfo
    );

    if (responseData && responseData.success) {
      const newMessage = responseData.data;
      updateUIAfterSendMessage(newMessage);
      updateCurrentChatLastMessage(newMessage);
      await updateLastMessage(newMessage._id);
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
    console.log(senderUsername);
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
      //console.log(`messageId ${message._id}`);
      return (
        <div className="message-container" key={message._id}>
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
      await setCurrentChat((prevChat) => ({
        ...prevChat,
        new: undefined,
      }));
    }
    console.log("chat id" + currentChat.id);
    await socket.emit("leave_room", currentChat.id);
    await setCurrentChat(null);
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
