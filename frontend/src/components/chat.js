import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";

function Chat({
  chat,
  setCurrentChat,
  loggedUser,
  isUserInChatroom,
  setIsUserInChatroom,
  chatHistory,
  setChatHistory,
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
    const reqParams = isGroupChat ? `${userID}/${chatID}` : chatID;
    async function fetchMessages() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages/conversation/${reqParams}`
        );
        const data = res.data;
        console.log(data);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, []);

  function exitChat() {
    console.log(isUserInChatroom);
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (messages.length === 0) {
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
    }
  }

  function emptyMessage() {
    setMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  async function sendMessage() {
    const message = {
      sender: userID,
      message: messageContent,
      ...(isGroupChat ? { chatroom: chatID } : { recipient: chatID }),
    };
    console.log("message payload", message);
    emptyMessage();
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message created", data);
      setMessages([...messages, message]);
    } catch {
      console.error("Failed to send message");
    }
  }

  return (
    <div className="chat">
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
        {messages.map((message) => {
          console.log(message.createdAt);
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
                <div>{message.text}</div>
                <div>{message.createdAt}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chat-footer">
        <input
          id="message-text"
          className="message-text"
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
