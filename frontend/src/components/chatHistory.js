import React, { useEffect } from "react";
import ScrollableFeed from "react-scrollable-feed";

function ChatHistory({
  chatHistory,
  setChatHistory,
  socket,
  chatHistoryLoading,
  loggedUserId,
  dateFormat,
  enterChat,
}) {
  useEffect(() => {
    if (!socket) return;

    // Add the event listener for receiving messages
    socket.on("receive_message", (message, senderData) => {
      const chatStrObjectId = message.conversation
        ? message.conversation
        : message.chatroom;
      const chat = chatHistory.find(
        (chat) => chat.strObjectId === chatStrObjectId
      );

      if (chat) {
        chat.lastMessage = message;
        console.log(message);
        if (message.isHumanSender) {
          setChatHistory((prevChatHistory) => [
            chat,
            ...prevChatHistory.filter((prevChat) => prevChat.id !== chat.id),
          ]);
        } else {
          // If the sender is the system, only update the lastMessage property
          setChatHistory([...chatHistory]);
        }
      } else {
        const members = [loggedUserId.toString(), message.sender];
        const sortedMembers = members.map((member) => member.toString()).sort();
        console.log("sorted", sortedMembers);
        const chatId = sortedMembers.reduce((acc, member) => acc + member, "");
        const newChat = {
          id: chatId,
          strObjectId: chatStrObjectId,
          title: senderData.username,
          imageURL: senderData.imageURL,
          lastMessage: message,
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
  }, [socket, chatHistory, setChatHistory, loggedUserId]);

  return (
    <div id="chat-history">
      {chatHistoryLoading ? (
        <p className="loading">Loading chat history...</p>
      ) : (
        <ScrollableFeed>
          {chatHistory.map((chat) => {
            const lastMessage = chat.lastMessage;
            if (!lastMessage) return null;
            const sender =
              chat.lastMessage.sender === loggedUserId ? "You: " : "";
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
      )}
    </div>
  );
}

export default ChatHistory;
