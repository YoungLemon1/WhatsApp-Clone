import React, { useEffect, useState, useRef, useCallback } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";
import { API_URL } from "../constants";

function Chat({
  chat,
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

  const userId = useRef(null);
  const isChatroom = useRef(false);
  //const prevLastMessage = useRef(chat.lastMessage);
  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const updateChatLastMessage = useCallback(
    (message) => {
      setCurrentChat((prevChat) => ({
        ...prevChat,
        lastMessage: message,
      }));
    },
    [setCurrentChat]
  );

  const updateChatStrObjectId = useCallback(
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
    // Add the event listener for receiving messages
    const handleReceiveMessage = (message) => {
      console.log("meesage received", message);
      addMessage(message);
      updateChatLastMessage(message);
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, updateChatLastMessage]);

  // Clean up the event listener when the component unmounts

  useEffect(() => {
    userId.current = loggedUser._id;
    async function fetchMessages() {
      if (chat.new) {
        setLoading(false);
        return;
      }
      try {
        const res = await Axios.get(
          `${API_URL}/messages?chatId=${chat.id}&chatStrObjectId=${chat.strObjectId}`
        );
        const data = res.data;
        isChatroom.current = data.isChatroom;
        chat.members = data.members;
        setMessages(data.messages);
        setLoading(false);
        console.log(chat.members);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat, loggedUser._id, chat.isChatroom]);

  //#endregion

  //#region Server request functions

  async function createConversation() {
    try {
      const res = await Axios.post(`${API_URL}/conversations`, {
        members: chat.members,
      });
      const data = res.data;
      console.log("User conversation created", data);
      return data._id;
    } catch (err) {
      console.error("Failed to create conversation", err);
      alert("Failed to create a new conversation. Please try again.");
    }
  }

  async function createAndEmitMessage(message, recipients, senderData) {
    try {
      const res = await Axios.post(`${API_URL}/messages`, message);
      const data = res.data;
      socket.emit("send_message", data.data, recipients, senderData, chat.id);
      return data;
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Failed to send the message. Please try again.");
    }
  }

  async function updateLastMessage(lastMessageId) {
    try {
      const chatType = !isChatroom.current ? "conversations" : "chatrooms";
      const res = await Axios.patch(
        `${API_URL}/${chatType}/${chat.strObjectId}?fieldToUpdate=lastMessage&updatedValue=${lastMessageId}`
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
  function updateUIAfterSendMessage(newMessage) {
    setCurrentMessageContent("");
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setCurrentChat((prevChat) => ({ ...prevChat, lastMessage: newMessage }));
  }

  // In case of an error, rolls back the UI to its previous state.
  function rollbackUIAfterFailedMessage(prevLastMessage, prevChatHistory) {
    setCurrentChat((prevChat) => ({
      ...prevChat,
      lastMessage: prevLastMessage,
    }));
    setMessages((prevMessages) => [...prevMessages.slice(0, -1)]);
    setChatHistory((prevChatHistory) => [...prevChatHistory]);
  }

  // Updates the chat history based on the message's sender type.
  function updateChatHistoryAfterMessageSend(responseData) {
    const { isHumanSender, ...restData } = responseData.data;
    if (isHumanSender) {
      setCurrentChat((prevChat) => ({
        ...prevChat,
        lastMessage: restData,
      }));
      setChatHistory((prevChatHistory) => [
        chat,
        ...prevChatHistory.filter((prevChat) => prevChat.id !== chat.id),
      ]);
    } else {
      setChatHistory((prevChatHistory) => [...prevChatHistory]);
    }
  }
  //#endregion

  // Main function to send a message and update UI accordingly.
  async function sendMessage() {
    const getRecipients = (chat) =>
      chat.members.filter((m) => m !== loggedUser._id.toString());
    const chatType = !isChatroom.current ? "conversation" : "chatroom";

    if (!isChatroom.current && !chat.strObjectId && messages.length === 0) {
      const conversationId = await createConversation();
      if (!conversationId) return; // Error handling is done inside createConversation.

      setCurrentChat((prevChat) => ({
        ...prevChat,
        strObjectId: conversationId,
      }));
    }

    const prevLastMessage = chat.lastMessage;
    const prevChatHistory = [...chatHistory];

    const messagePayload = {
      sender: userId.current,
      message: currentMessageContent,
      [chatType]: chat.strObjectId,
    };

    console.log(messagePayload);

    const senderInfo = {
      username: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };

    const responseData = await createAndEmitMessage(
      messagePayload,
      getRecipients(chat),
      senderInfo
    );

    if (responseData && responseData.success) {
      const newMessage = responseData.data;
      updateUIAfterSendMessage(newMessage);
      await updateLastMessage(newMessage._id);
      updateChatHistoryAfterMessageSend(responseData);
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
    if (isChatroom.current && message.sender.username === "SYSTEM") return null;
    return dateFormat(message.createdAt);
  }
  //#endregion

  function mapMessages() {
    return messages.map((message) => {
      return (
        <div className="message-container" key={message._id}>
          <div className={setMessageClassName(message)}>
            <p>{isChatroom.current ? setMessageHeader(message) : ""}</p>
            <p>{message.message}</p>
            <small>{setMessageDate(message)}</small>
          </div>
        </div>
      );
    });
  }

  async function exitChat() {
    if (chat.new) setCurrentChat({ new: undefined });
    socket.emit("leave_room", chat.id);
    setCurrentChat(null);
    console.log(`${loggedUser.username} exited chat ${chat.id}`);
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="exit-btn" onClick={exitChat}>
          ←
        </button>
        <img
          className="profile-img"
          src={chat.imageURL}
          alt="chat profile"
        ></img>
        <h4 className="chat-name">{chat.title ?? "Error: undefined chat"}</h4>
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
