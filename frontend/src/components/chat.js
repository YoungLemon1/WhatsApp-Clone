import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useParams } from "react-router-dom";

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
  function exitChat() {
    console.log(isUserInChatroom);
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (messages.length === 0) {
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
    }
    return;
  }
  return (
    <div>
      <div id="chat-header">
        <button onClick={exitChat}>←</button>
        <img src={chat.imageURL} alt="chat profile"></img>
        <h1>{chat.name}</h1>
      </div>
      <div id="chat-content">
        {messages.map((message) => {
          return <div key={message._id}></div>;
        })}
      </div>
      <div id="chat-footer">
        <input id="message-text"></input>
        <Button>Send</Button>
      </div>
    </div>
  );
}
export default Chat;
