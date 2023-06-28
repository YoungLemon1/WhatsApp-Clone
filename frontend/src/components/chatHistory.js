import React, { useState, useEffect } from "react";
import Axios from "axios";

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
      {userInteractions.map((chat) => {
        const sender = chat.lastMessage.sender === loggedUserID ? "You: " : "";
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
                alt={`${chat.name} profile`}
              ></img>
              <h4>{chat.name}</h4>
            </div>
            <div id="last-message">
              <p>
                {sender}
                {chat.lastMessage.message}
              </p>
              <small>{dateFormat(chat.lastMessage.createdAt)}</small>
            </div>
            <hr></hr>
          </div>
        );
      })}
    </div>
  );
}

export default ChatHistory;
