import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";

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

  const userId = useRef(null);
  const chatId = useRef(null);
  const isChatroom = useRef(false);

  useEffect(() => {
    // Add the event listener for receiving messages
    socket.on("receive_message", (message) => {
      console.log("meesage received", message);
      chat.lastMessage = message;
      setMessages([...messages, message]);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("receive_message");
    };
  }, [socket, chat, messages]);

  useEffect(() => {
    userId.current = loggedUser._id;
    chatId.current = chat.id;
    async function fetchMessages() {
      if (chat.newChat) {
        setLoading(false);
        return;
      }
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages?chatId=${chat.id}&chatStrObjectId=${chat.strObjectId}`
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

  function emptyMessage() {
    setCurrentMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  async function sendMessage() {
    let conversationId;
    if (!isChatroom.current && messages.length === 0) {
      const conversation = {
        members: chat.members,
      };
      const res = await Axios.post(
        "http://localhost:5000/conversations",
        conversation
      );
      conversationId = res.data._id.toString();
      chat.strObjectId = conversationId;
      console.log("User conversation created", res.data);
    }

    const message = {
      sender: userId.current,
      message: currentMessageContent,
      ...(isChatroom.current
        ? { chatroom: chat.strObjectId }
        : { conversation: conversationId || chat.strObjectId }),
    };

    console.log("message payload", message);
    const recipients = chat.members.filter(
      (m) => m !== loggedUser._id.toString()
    );
    const senderData = {
      username: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };
    const res = await Axios.post("http://localhost:5000/messages", message);
    const data = res.data;
    console.log("Message created", data);
    chat.lastMessage = data;
    chat.lastUpdatedAt = data.createdAt;
    const newMessage = !isChatroom.current
      ? data
      : {
          ...data,
          sender: {
            _id: loggedUser._id,
            username: loggedUser.username,
            imageURL: loggedUser.imageURL,
            role: loggedUser.role,
          },
        };
    emptyMessage();
    setMessages([...messages, newMessage]);
    setChatHistory((prevChatHistory) => [
      chat,
      ...prevChatHistory.filter((prevChat) => prevChat.id !== chatId.current),
    ]);
    console.log("Message recepients", recipients);
    socket.emit("send_message", data, recipients, senderData);
  }

  async function exitChat() {
    if (!isChatroom.current && messages.length === 0) {
      delete chat.members;
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
      console.log("chat history", updatedChatHistory);
    } else if (chat.newChat) delete chat.newChat;
    if (chat.strObjectId) {
      try {
        const chatType = !isChatroom.current ? "conversations" : "chatrooms";
        const res = await Axios.put(
          `http://localhost:5000/${chatType}/${chat.strObjectId}/lastMessage:`,
          chat.lastMessage._id
        );
        console.log(res.data);
      } catch (err) {
        console.error("update chat failed", err);
      }
    }
    socket.emit("leave_room", chatId.current);
    setCurrentChat(null);
    console.log(`${loggedUser.username} exited chat ${chat.id}`);
  }

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
