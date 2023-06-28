import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";

function Chat({
  chat,
  setCurrentChat,
  loggedUser,
  setIsUserInChatroom,
  chatHistory,
  setChatHistory,
  dateFormat,
}) {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");

  const userID = useRef(null);
  const chatID = useRef(null);
  const isGroupChat = useRef(null);

  useEffect(() => {
    userID.current = loggedUser._id;
    chatID.current = chat.id;
    isGroupChat.current = chat.isGroupChat;
    console.log(userID.current, chatID.current, isGroupChat.current);
    const queryParams = chat.isGroupChat
      ? `chatroomID=${chat.id}`
      : `userID=${loggedUser._id}&otherUserID=${chat.id}`;
    async function fetchMessages() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages?${queryParams}`
        );
        const data = res.data;
        console.log(data);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat.id, loggedUser._id, chat.isGroupChat]);

  function exitChat() {
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (!isGroupChat.current && messages.length === 0) {
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
    const message = {
      sender: userID.current,
      message: messageContent,
      ...(isGroupChat.current
        ? { chatroom: chatID.current }
        : { recipient: chatID.current }),
      createdAt: Date.now(),
    };
    console.log("message payload", message);
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message created", data);
      emptyMessage();
      setMessages([...messages, data]);
      chat.lastMessage = {
        id: data._id.toString(),
        sender: data.sender.toString(),
        message: data.message,
        createdAt: data.createdAt,
      };
      console.log(chat.lastMessage);
      console.log(messages);
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
        <h4 className="chat-name">{chat.name}</h4>
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
