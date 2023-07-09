import React, { useEffect } from "react";
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

    // Add the event listener for receiving messages
    socket.on("receive_message", (message, senderData) => {
      const chatId = message.conversation || message.chatroom;
      const chatExists = chatHistory.some((chat) => chat.id === chatId);

      if (chatExists) {
        setChatHistory((prevChatHistory) => {
          return prevChatHistory.map((chat) => {
            if (chat.id === chatId) {
              chat.lastMessage = {
                id: message._id.toString(),
                sender: message.sender,
                message: message.message,
                createdAt: message.createdAt,
              };
            }
            return chat;
          });
        });
      } else {
        const newChat = {
          id: chatId,
          title: senderData.username,
          imageURL: senderData.imageURL,
          lastMessage: {
            id: message._id.toString(),
            sender: message.sender,
            message: message.message,
            createdAt: message.createdAt,
          },
        };
        setChatHistory((prevChatHistory) => [newChat, ...prevChatHistory]);
      }
    });

    // Clean up the event listener when the component unmounts
    return () => {
      if (socket) {
        socket.off("receive_message");
      }
    };
  }, [socket, chatHistory, setChatHistory]);

  return (
    <div id="chat-history">
      <ScrollableFeed>
        {chatHistory.map((chat) => {
          const lastMessage = chat.lastMessage;
          if (!lastMessage) return null;
          const sender =
            chat.lastMessage.sender === loggedUserID ? "You: " : "";
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
                <p>{sender + lastMessage.message}</p>
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
