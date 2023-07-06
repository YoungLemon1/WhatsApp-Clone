import React, { useEffect } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";

function ChatHistory({
  chatHistory,
  setChatHistory,
  socket,
  loggedUserID,
  dateFormat,
  enterChat,
}) {
  useEffect(() => {
    if (!socket) return;

    const fetchConversation = async (conversationId) => {
      try {
        const res = await Axios.get(
          `http://localhost:5000/conversations/${conversationId}`
        );
        return res.data;
      } catch (error) {
        console.log("Failed to fetch user", error);
      }
    };

    const fetchChatroom = async (chatroomId) => {
      try {
        const res = await Axios.get(
          `http://localhost:5000/chatrooms/${chatroomId}`
        );
        return res.data;
      } catch (error) {
        console.log("Failed to fetch chatroom", error);
      }
    };

    const handleMessageReceived = (data) => {
      const { conversation, chatroom, ...messageData } = data;

      const chatId = conversation || chatroom;
      const collection = conversation ? "conversations" : "chatrooms";

      const chatExists = chatHistory.some((chat) => chat.id === chatId);

      if (chatExists) {
        setChatHistory((prevChatHistory) => {
          return prevChatHistory.map((chat) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                lastMessage: {
                  id: data._id.toString(),
                  sender: messageData.sender,
                  message: messageData.message,
                  createdAt: messageData.createdAt,
                },
              };
            }
            return chat;
          });
        });
      } else {
        const fetchChatData =
          collection === "conversations"
            ? fetchConversation(conversation)
            : fetchChatroom(chatroom);

        fetchChatData.then((chatData) => {
          const newChat = {
            id: chatId,
            title: chatData.username || chatData.title,
            imageURL: chatData.imageURL,
            lastMessage: {
              id: data._id.toString(),
              sender: messageData.sender,
              message: messageData.message,
              createdAt: messageData.createdAt,
            },
          };
          setChatHistory((prevChatHistory) => [newChat, ...prevChatHistory]);
        });
      }
    };

    // Add the event listener for receiving messages
    socket.on("receive_message", handleMessageReceived);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("receive_message", handleMessageReceived);
    };
  }, [socket, chatHistory, setChatHistory]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages/last-messages?userID=${loggedUserID}`
        );
        const data = res.data;
        setChatHistory(data);
        console.log("successfully fetched user chat history", data);
      } catch (error) {
        console.error("Failed to fetch user chat history", error);
      }
    }
    fetchData();
  }, [loggedUserID, setChatHistory]);

  return (
    <div id="chat-history">
      <ScrollableFeed>
        {chatHistory.map((chat) => {
          const sender =
            chat.lastMessage.sender === loggedUserID ? "You: " : "";
          const lastMessage = chat.lastMessage;
          return (
            <div
              className="chat-history-item"
              key={chat.id}
              onClick={() => enterChat(chat)}
            >
              <div id="conversation-details">
                <img
                  className="profile-img"
                  src={chat.imageURL}
                  alt={`${chat.title} profile`}
                ></img>
                <h4>{chat.title}</h4>
              </div>
              <div id="last-message">
                <p>
                  {sender} {lastMessage.message}
                </p>
                <small>{dateFormat(lastMessage.createdAt)}</small>
              </div>
              <hr></hr>
            </div>
          );
        })}
      </ScrollableFeed>
    </div>
  );
}

export default ChatHistory;
