import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";
import { API_URL } from "../constants";

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
  const [currentMessageContent, setCurrentMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [newMessages, setNewMessages] = useState(false);

  const userId = useRef(null);
  const chatId = useRef(null);
  const isChatroom = useRef(false);

  //#region lifecycle functions
  useEffect(() => {
    // Add the event listener for receiving messages
    socket.on("receive_message", (message) => {
      console.log("meesage received", message);
      chat.lastMessage = message;
      setMessages([...messages, message]);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("receive_message");
    };
  }, [socket, chat, messages]);

  useEffect(() => {
    userId.current = loggedUser._id;
    chatId.current = chat.id;
    async function fetchMessages() {
      if (chat.newChat) {
        setLoading(false);
        return;
      }
      try {
        const res = await Axios.get(
          `${API_URL}/messages?chatId=${chat.id}&chatStrObjectId=${chat.strObjectId}`
        );
        const data = res.data;
        isChatroom.current = data.isChatroom;
        chat.members = data.members;
        setMessages(data.messages);
        setLoading(false);
        console.log(chat.members);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    }

    fetchMessages();
  }, [chat, loggedUser._id, chat.isChatroom]);

  //#endregion

  //#region server request functions
  async function createConversation() {
    const conversation = {
      members: chat.members,
    };
    try {
      const res = await Axios.post(`${API_URL}/conversations`, conversation);

      const data = res.data;
      console.log("User conversation created", data);
      return data._id;
    } catch (err) {
      console.error("Failed to create conversation");
    }
  }

  async function createAndEmitMessage(message, recipients, senderData) {
    try {
      const res = await Axios.post(`${API_URL}/messages`, message);
      const data = res.data;
      console.log("Message created", data);
      socket.emit("send_message", data, recipients, senderData);
      return data;
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }
  //#endregion

  /*updates the users chat history and the message list after sending a message
   and indicates that messages have been sent in this chat. */
  function updateUIAfterMessageSend(data) {
    chat.lastMessage = data;
    const { isHumanSender, ...dataRest } = data;
    const newMessage = !isChatroom.current
      ? dataRest
      : {
          ...dataRest,
          sender: {
            _id: loggedUser._id,
            username: loggedUser.username,
            imageURL: loggedUser.imageURL,
          },
        };
    setCurrentMessageContent("");
    setMessages([...messages, newMessage]);
    setNewMessages(true);
    if (data.isHumanSender)
      setChatHistory((prevChatHistory) => [
        chat,
        ...prevChatHistory.filter((prevChat) => prevChat.id !== chatId.current),
      ]);
    else setChatHistory([...chatHistory]);
  }

  // send message and emit to chat and chat history of the rcepients
  async function sendMessage() {
    function getRecipients(chat) {
      return chat.members.filter((m) => m !== loggedUser._id.toString());
    }
    if (!isChatroom.current && !chat.strObjectId && messages.length === 0) {
      const conversationId = await createConversation();
      if (!conversationId) {
        console.error("cannot send message. Chat is undefined");
        return;
      }
      chat.strObjectId = conversationId;
    }

    const message = {
      sender: userId.current,
      message: currentMessageContent,
      ...(isChatroom.current
        ? { chatroom: chat.strObjectId }
        : { conversation: chat.strObjectId }),
    };

    console.log("message payload", message);
    const recipients = getRecipients(chat);
    const senderData = {
      username: loggedUser.username,
      imageURL: loggedUser.imageURL,
    };

    const data = await createAndEmitMessage(message, recipients, senderData);
    console.log("Message created", data);
    updateUIAfterMessageSend(data);
  }

  //#region styling and displaying message functions
  function setMessageClassName(message) {
    const senderObjectId = message.sender._id;
    let senderId = senderObjectId ? senderObjectId.toString() : message.sender;
    let msgString = "message";
    if (message.sender.username === "SYSTEM") {
      return `${msgString} system`;
    }
    return `${msgString} ${
      senderId === loggedUser._id.toString() ? "current-user" : "other-user"
    }`;
  }

  function setMessageHeader(message) {
    const senderObjectId = message.sender._id;
    const senderId = senderObjectId
      ? senderObjectId.toString()
      : message.sender;
    const senderUsername = message.sender.username;
    console.log(senderUsername);
    return senderId !== loggedUser._id.toString() && senderUsername !== "SYSTEM"
      ? senderUsername
      : "";
  }

  function setMessageDate(message) {
    if (isChatroom.current && message.sender.username === "SYSTEM") return null;
    return dateFormat(message.createdAt);
  }
  //#endregion

  function mapMessages() {
    return messages.map((message) => {
      return (
        <div className="message-container" key={message._id}>
          <div className={setMessageClassName(message)}>
            <p>{isChatroom.current ? setMessageHeader(message) : ""}</p>
            <p>{message.message}</p>
            <small>{setMessageDate(message)}</small>
          </div>
        </div>
      );
    });
  }

  async function exitChat() {
    if (!isChatroom.current && messages.length === 0) {
      delete chat.members;
      const updatedChatHistory = chatHistory.filter((c) => c.id !== chat.id);
      setChatHistory(updatedChatHistory);
      console.log("chat history", updatedChatHistory);
    } else if (chat.newChat) delete chat.newChat;
    if (chat.strObjectId && newMessages) {
      try {
        const chatType = !isChatroom.current ? "conversations" : "chatrooms";
        const lastMessageId = chat.lastMessage._id;
        const res = await Axios.patch(
          `${API_URL}/${chatType}/${chat.strObjectId}?fieldToUpdate=lastMessage&updatedValue=${lastMessageId} `
        );
        console.log(
          "chat updated. success: " + res.data.success,
          res.data.data
        );
      } catch (err) {
        console.error("update chat failed", err);
      }
    }
    socket.emit("leave_room", chatId.current);
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
          <ScrollableFeed>{mapMessages()}</ScrollableFeed>
        )}
      </div>
      <div className="chat-footer">
        <input
          id="message-text"
          className="message-text"
          placeholder="Send a message"
          onChange={(event) => {
            setCurrentMessageContent(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && currentMessageContent !== "") {
              sendMessage();
            }
          }}
        ></input>
        <button
          className="send-btn"
          disabled={currentMessageContent === ""}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;
