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
        {chatHistory.map((interaction) => {
          const sender =
            interaction.lastMessage.sender === loggedUserID ? "You: " : "";
          const lastMessage = interaction.lastMessage;
          return (
            <div
              className="chat-history-item"
              key={interaction.id}
              onClick={() => enterChat(interaction)}
            >
              <div id="conversation-details">
                <img
                  className="profile-img"
                  src={interaction.imageURL}
                  alt={`${interaction.title} profile`}
                ></img>
                <h4>{interaction.title}</h4>
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
