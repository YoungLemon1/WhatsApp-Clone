import React, { useState, useEffect } from "react";
import Axios from "axios";
import ScrollableFeed from "react-scrollable-feed";

function ChatHistory({ loggedUserID, dateFormat, enterChat }) {
  const [userInteractions, setUserInteractions] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages/last-messages?userID=${loggedUserID}`
        );
        const data = res.data;
        setUserInteractions(data);
        console.log("successfully fetched user chat history", data);
      } catch (error) {
        console.error("Failed to fetch user chat history", error);
      }
    }
    fetchData();
  }, [loggedUserID]);
  return (
    <div id="chat-history">
      <ScrollableFeed>
        {userInteractions.map((interaction) => {
          const sender =
            interaction.lastMessage.sender === loggedUserID ? "You: " : "";
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
                  alt={`${interaction.interactedWith} profile`}
                ></img>
                <h4>{interaction.name}</h4>
              </div>
              <div id="last-message">
                <p>
                  {sender}
                  {interaction.lastMessage.message}
                </p>
                <small>{dateFormat(interaction.lastMessage.createdAt)}</small>
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
