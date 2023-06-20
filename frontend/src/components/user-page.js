import React, { useEffect, useState } from "react";
import Axios from "axios";
import moment from "moment";
import { Button } from "react-bootstrap";

function UserPage({ user }) {
  const [chats, setChats] = useState([]);
  const [isSendToUser, setIsSendToUser] = useState(false);
  useEffect(
    () =>
      async function fetchData() {
        const res = await Axios.get(
          `http://localhost:5000/chatrooms/user/${user._id}`
        );
        const data = res.data;
        setChats(data);
      },
    [user._id]
  );
  /*function dateFormat(date) {
    if (date) {
      return moment(date).format("DD-MM-YYYY");
    } else return "";
  }*/
  async function getUser(id) {
    try {
      const res = await Axios.get(`http://localhost:5000/users/${id}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching user", error);
    }
  }
  return (
    <div>
      <h1>{user.username}</h1>
      <div id="chat-history">
        {chats.map((chat) => {
          if (chat.isGroupChat) {
            return (
              <div>
                {chat.groupChatPicture} {chat.groupChatName}
              </div>
            );
          }
          const otherUserID = chat.members.find(
            (memeber) => memeber !== user._id
          );
          const otherUser = getUser(otherUserID);
          return (
            <div>
              <img
                className="user-image"
                src={otherUser.imageURL}
                alt={otherUser.username}
              ></img>
              <h6>{otherUser.username}</h6>
            </div>
          );
        })}
      </div>
      <div>
        {isSendToUser ? "true" : "false"}
        <Button id="send-to-user-btn" onClick={setIsSendToUser(!isSendToUser)}>
          {isSendToUser ? "+" : "X"}
        </Button>
      </div>
    </div>
  );
}

export default UserPage;
