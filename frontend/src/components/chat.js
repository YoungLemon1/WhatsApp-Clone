import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import Axios from "axios";

function Chat({
  chat,
  setCurrentChat,
  loggedUser,
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
    console.log(userID.current, chatID.current, isGroupChat.current);
    const reqParams = chat.isGroupChat
      ? chat.id
      : `${loggedUser._id}/${chat.id}`;
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
  }, [chat.id, loggedUser._id, chat.isGroupChat]);

  function exitChat() {
    setCurrentChat({});
    setIsUserInChatroom(false);
    if (!isGroupChat.current && messages.length === 0) {
      console.log(chatHistory);
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
    }
  }

  function emptyMessage() {
    setMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:MM");
    } else return "";
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
                <div>{message.message}</div>
                <div>{dateFormat(message.createdAt)}</div>
              </div>
            </div>
          );
        })}
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
