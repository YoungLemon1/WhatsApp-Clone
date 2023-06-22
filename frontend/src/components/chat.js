import React, { useEffect, useState } from "react";
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
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const res = Axios.get(
        `http://localhost:5000/messages/chatroom/${chat.id}`
      );
      const data = res.data;
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  }, [chat.id, messages.length]);

  function exitChat() {
    console.log(isUserInChatroom);
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (messages.length === 0) {
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
    }
  }

  async function sendMessage() {
    const message = {
      sender: loggedUser._id,
      text: messageText,
    };
    console.log("message payload", message);
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message sent", data);
      setMessages([...messages, message]);
      setMessageText("");
      const textInput = document.getElementById("message-text");
      textInput.value = "";
    } catch {
      console.error("Failed to send message");
    }
    if (messages.length === 0) {
      try {
        delete chat.id;
        const res = await Axios.post("http://localhost:5000/chatrooms", chat);
        const data = res.data;
        console.log("chatroom created", data);
        chat.id = data._id;
      } catch {
        console.error("Failed to create chatroom");
      }
    }
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
          let sender;
          return (
            <div
              key={message._id}
              className={`message ${
                sender === loggedUser._id ? "current-user" : "other-user"
              }`}
            >
              {message.createdAt}
            </div>
          );
        })}
      </div>
      <div className="chat-footer">
        <input
          id="message-text"
          className="message-text"
          onChange={(event) => {
            setMessageText(event.target.value);
          }}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
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
