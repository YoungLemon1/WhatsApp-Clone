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
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);

  const userID = useRef(null);
  const chatID = useRef(null);
  const isGroupChat = useRef(false);

  useEffect(() => {
    // Add the event listener for receiving messages
    socket.on("receive_message", (message) => {
      console.log("meesage received");
      setMessages([...messages, message]);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("receive_message");
    };
  }, [socket, chat.members, messages]);

  useEffect(() => {
    userID.current = loggedUser._id;
    chatID.current = chat.id;
    async function fetchMessages() {
      if (chat.newChat) return;
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages?chatId=${chat.id}`
        );
        const data = res.data;
        isGroupChat.current = data.isGroupChat;
        chat.members = data.members;
        setMessages(data.messages);
        setLoading(false);
        console.log(chat.members);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat, loggedUser._id, chat.isGroupChat]);

  function emptyMessage() {
    setMessageContent("");
    const textInput = document.getElementById("message-text");
    textInput.value = "";
  }

  async function sendMessage() {
    let conversationID;
    if (messageContent.length === 0) return;
    if (!isGroupChat.current && messages.length === 0) {
      const conversation = {
        members: chat.members,
      };
      const res = await Axios.post(
        "http://localhost:5000/conversations",
        conversation
      );
      conversationID = res.data._id.toString();
      console.log("User conversation created", res.data);
    }

    const message = {
      sender: userID.current,
      message: messageContent,
      ...(isGroupChat.current
        ? { chatroom: chatID.current }
        : { conversation: conversationID || chatID.current }),
    };

    console.log("message payload", message);

    const res = await Axios.post("http://localhost:5000/messages", message);
    const data = res.data;
    console.log("Message created", data);
    chat.lastMessage = data;
    chat.lastUpdatedAt = data.createdAt;
    const newMessage = {
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
    const recipients = chat.members;
    const senderData = {
      username: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };
    console.log("Message recepients", recipients);
    socket.emit("send_message", data, recipients, senderData);
  }

  async function exitChat() {
    if (!isGroupChat.current && messages.length === 0) {
      delete chat.members;
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
      console.log("chat history", updatedChatHistory);
    } else if (chat.newChat) delete chat.newChat;
    socket.emit("leave_room", chatID.current);
    setCurrentChat(null);
    console.log(`${loggedUser.username} exited chat ${chat.id}`);
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
          <ScrollableFeed>
            {messages.map((message) => {
              return (
                <div className="message-container" key={message._id}>
                  <div
                    key={message._id}
                    className={`message ${
                      message.sender.username === "SYSTEM"
                        ? "system"
                        : message.sender._id.toString() ===
                          loggedUser._id.toString()
                        ? "current-user"
                        : "other-user"
                    }`}
                  >
                    <p>
                      {isGroupChat.current &&
                      message.sender._id !== loggedUser._id &&
                      message.sender.role !== "system"
                        ? message.sender.username
                        : ""}
                    </p>
                    <p>{message.message}</p>
                    <small>
                      {message.sender.role !== "system"
                        ? dateFormat(message.createdAt)
                        : ""}
                    </small>
                  </div>
                </div>
              );
            })}
          </ScrollableFeed>
        )}
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
