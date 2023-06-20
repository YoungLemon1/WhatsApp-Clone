import React, { useEffect, useState } from "react";
import Axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

function UserPage({ user }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [isSendToUser, setIsSendToUser] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/chatrooms/user/${user._id}`
        );
        const json = await res.json();
        console.log(json);
        setChatHistory(json);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    }
    fetchData();
  }, [user._id]);
  /*function dateFormat(date) {
    if (date) {
      return moment(date).format("DD-MM-YYYY");
    } else return "";
  }*/
  function SendToUserCkick() {
    setIsSendToUser(!isSendToUser);
  }
  async function enterChatRoom() {
    if (!chatSearch) {
      return;
    }
    const chat = chatHistory.find((c) => c.name === chatSearch);
    const responseUserExists = await Axios.get(
      `http://localhost:5000/users/search/${chatSearch}`
    );
    const responseChatroomExists = await Axios.get(
      `http://localhost:5000/chatrooms/search/${chatSearch}`
    );
    if (!chat) {
      setChatHistory(...chatHistory, {
        id: "1111111111111111111",
        isGroupChat: false,
        name: chatName,
        imageURL: chatImageURL,
      });
    }
    navigate(`/chat/${chat.id}`);
  }

  return (
    <div>
      <h1>{user.username}</h1>
      <div id="chat-history">
        {chatHistory.map((chat) => {
          return (
            <div key={chat.id}>
              <img
                className="profile-picture"
                src={chat.imageURL}
                alt={chat.name}
              ></img>
            </div>
          );
        })}
      </div>
      <div id="send-message-to-user">
        {!isSendToUser ? (
          <div />
        ) : (
          <div>
            <label htmlFor="send-to">Chat with user or group</label>
            <input
              id="chat-name"
              onChange={(event) => {
                setChatSearch(event.target.value);
              }}
            ></input>
            <button className="submit-btn" onClick={enterChatRoom}>
              {" "}
              Enter Chat
            </button>
          </div>
        )}
        <Button id="send-to-user-btn" onClick={SendToUserCkick}>
          {!isSendToUser ? "+" : "X"}
        </Button>
      </div>
    </div>
  );
}

export default UserPage;
