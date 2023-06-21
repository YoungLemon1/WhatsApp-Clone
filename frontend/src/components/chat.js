import React, { useState } from "react";
import Axios from "axios";
import { Button } from "react-bootstrap";

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
  const [messageText, setMessageText] = useState("");
  function exitChat() {
    console.log(isUserInChatroom);
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (messages.length === 0) {
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
    }
  }
  function sendMessage() {
    const message = {};
  }
  return (
    <div className="chat">
      <div className="chat-header">
        <button className="exit-btn" onClick={exitChat}>
          ←
        </button>
        <img className="chat-img" src={chat.imageURL} alt="chat profile"></img>
        <h4 className="chat-name">{chat.name}</h4>
      </div>
      <div className="chat-body">
        {messages.map((message) => {
          return <div key={message._id}></div>;
        })}
      </div>
      <div className="chat-footer">
        <input
          className="message-text-box"
          onChange={(event) => {
            setMessageText(event.target.value);
          }}
        ></input>
        <button className="send-btn" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;
