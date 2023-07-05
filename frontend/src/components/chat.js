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
  decodeText,
}) {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");

  const userID = useRef(null);
  const chatID = useRef(null);
  const isGroupChat = useRef(false);

  console.log("chat", chat);

  useEffect(() => {
    // Listen for the "new-message" event
    socket.on("send_message", (message) => {
      // Add the message to the messages list
      // ...
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off("send_message");
    };
  }, [socket]);

  useEffect(() => {
    userID.current = loggedUser._id;
    chatID.current = chat.id;
    isGroupChat.current = chat.isGroupChat;
    async function fetchMessages() {
      try {
        const queryParams = isGroupChat.current
          ? `chatroom/?chatroomID=${chat.id}`
          : `conversation/?conversationID=${chat.id}`;
        const res = await Axios.get(
          `http://localhost:5000/messages/${queryParams}`
        );
        const data = res.data;
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat.id, loggedUser._id, chat.isGroupChat]);

  async function exitChat() {
    if (!isGroupChat.current && messages.length === 0) {
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
      console.log("chat history", updatedChatHistory);
    }
    setCurrentChat(null);
    console.log("exited chat");
  }

  function emptyMessage() {
    setMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  async function sendMessage() {
    let conversationID;
    if (!isGroupChat.current && messages.length === 0) {
      try {
        const conversation = {
          members: chat.members,
        };
        const res = await Axios.post(
          "http://localhost:5000/conversations",
          conversation
        );
        const data = res.data;
        conversationID = data._id.toString();
        console.log("user conversation created", data);
      } catch (error) {
        console.error("Failed to create conversation", error);
      }
    }
    const message = {
      sender: userID.current,
      message: messageContent,
      ...(isGroupChat.current
        ? { chatroom: chatID.current }
        : {
            conversation: conversationID ? conversationID : chatID.current,
          }),
    };
    console.log("message payload", message);
    try {
      const res = await Axios.post("http://localhost:5000/messages", message);
      const data = res.data;
      console.log("message created", data);
      chat.lastMessage = data;
      chat.lastUpdatedAt = data.createdAt;
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
                  <p dangerouslySetInnerHTML={{ __html: message.message }}></p>
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
