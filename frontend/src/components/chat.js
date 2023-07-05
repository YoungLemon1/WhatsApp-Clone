import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";
import { io } from "socket.io-client";

function Chat({
  chat,
  setCurrentChat,
  loggedUser,
  chatHistory,
  setChatHistory,
  setSearchText,
  dateFormat,
}) {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");

  const socket = useRef(null);
  const userID = useRef(null);
  const chatID = useRef(null);
  const isGroupChat = useRef(false);

  useEffect(() => {
    //socket.current = io("http://localhost:5000");
    userID.current = loggedUser._id;
    chatID.current = chat.id;
    isGroupChat.current = chat.isGroupChat;
    console.log(userID.current, chatID.current, isGroupChat.current);
    async function fetchMessages() {
      try {
        if (chat.id == null) {
          console.error("Failed to fetch messages: Empty chat", chat.id);
          return;
        }
        const res = await Axios.get(
          `http://localhost:5000/messages?${chat.id}`
        );
        const data = res.data;
        setMessages(data);
        //socket.current.connect();
        //socket.current.emit("join-chat", userID.current);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat.id, loggedUser._id, chat.isGroupChat, messages.length]);

  function exitChat() {
    setCurrentChat(null);
    setSearchText("");
    if (chat.id == null && messages.length === 0) {
      console.log("chat history", chatHistory);
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
      console.log("chat history", updatedChatHistory);
    }
  }

  function emptyMessage() {
    setMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  async function sendMessage() {
    let conversationID;
    if (chat.id == null) {
      try {
        const conversation = {
          members: chat.members,
        };
        const res = await Axios.post(
          "http://localhost:5000/conversations",
          conversation
        );
        const data = res.data;
        conversationID = res.data._id;
        console.log("user conversation created", data);
      } catch {
        console.error("Failed to create conversation");
      }
    }
    const message = {
      sender: userID.current,
      message: messageContent,
      ...(isGroupChat.current
        ? { chatroom: chatID.current }
        : { conversation: chatID.current ? chatID.current : conversationID }),
    };
    console.log("message payload", message);
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message created", data);
      emptyMessage();
      setMessages([...messages, data]);
    } catch {
      console.error("Failed to send message");
    }
  }

  console.log(chat);
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
        <ScrollableFeed>
          {messages.map((message) => {
            return (
              <div className="message-container" key={message._id}>
                <div
                  key={message._id}
                  className={`message ${
                    message.sender === loggedUser._id
                      ? "current-user"
                      : "other-user"
                  }`}
                >
                  <p>{message.message}</p>
                  <small>{dateFormat(message.createdAt)}</small>
                </div>
              </div>
            );
          })}
        </ScrollableFeed>
      </div>
      <div className="chat-footer">
        <input
          id="message-text"
          className="message-text"
          placeholder="Send a message"
          onChange={(event) => {
            setMessageContent(event.target.value);
          }}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        ></input>
        <button
          className="send-btn"
          disabled={messageContent === ""}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;
