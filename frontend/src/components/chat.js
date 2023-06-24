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
    const fetchMessages = async () => {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages/chatroom/${chat.id}`
        );
        const data = res.data;
        console.log(data);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
  }, [chat.id]);

  async function createNonGroupChatroom() {
    try {
      const res = await Axios.post("http://localhost:5000/chatrooms", chat);
      const data = res.data;
      console.log("chatroom created", data);
      chat.id = data._id;
    } catch {
      console.error("Failed to create chatroom");
    }
  }

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
    if (!chat.isGroupChat && messages.length === 0) {
      createNonGroupChatroom();
    }
    const message = {
      sender: loggedUser._id,
      chatroom: chat.id,
      text: messageText,
      createdAt: Date.now(),
    };
    console.log("message payload", message);
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message created", data);
      setMessages([...messages, message]);
      setMessageText("");
      const textInput = document.getElementById("message-text");
      textInput.value = "";
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
            setMessageText(event.target.value);
          }}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        ></input>
        <button
          className="send-btn"
          disabled={messageText === ""}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;
