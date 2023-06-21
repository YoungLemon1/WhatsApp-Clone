import React, { useEffect, useState } from "react";
import Axios from "axios";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import Chat from "./chat";

function UserPage({ user }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [isSendToUser, setIsSendToUser] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [isUserInChatroom, setIsUserInChatroom] = useState(false);
  const [currentChat, setCurrentChat] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/chatrooms/user/${user._id}`
        );
        console.log("data:", res.data);
        setChatHistory(res.data);
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
  function SendToUser() {
    setIsSendToUser(!isSendToUser);
  }

  async function enterChatRoom() {
    if (!chatSearch) {
      return;
    }
    const chat = chatHistory.find((c) => c.name === chatSearch);
    if (chat) {
      setIsSendToUser(false);
      setCurrentChat(chat);
      setIsUserInChatroom(true);
      return;
    }

    let userData;
    let groupChatData;

    try {
      const responseUserSearch = await Axios.get(
        `http://localhost:5000/users/search/${chatSearch}`
      );
      userData = responseUserSearch.data;
    } catch (error) {
      console.error(error);
      // Handle the error for the user search API request
    }

    try {
      const responseGroupChatSearch = await Axios.get(
        `http://localhost:5000/chatrooms/search/${chatSearch}`
      );
      groupChatData = responseGroupChatSearch.data;
    } catch (error) {
      console.error(error);
      // Handle the error for the group chat search API request
    }

    console.log("user data", userData);
    console.log("group data", groupChatData);

    if (userData) {
      const temporaryChatId = uuidv4();
      const newChatroom = {
        id: temporaryChatId,
        isGroupChat: false,
        name: userData.username,
        imageURL: userData.imageURL,
      };
      setChatHistory([...chatHistory, newChatroom]);
      setIsSendToUser(false);
      setCurrentChat(newChatroom);
      setIsUserInChatroom(true);
    } else if (groupChatData) {
      const newChatroom = {
        id: groupChatData._id,
        isGroupChat: true,
        name: groupChatData.groupChatName,
        imageURL: groupChatData.groupChatPicture,
      };
      setChatHistory([...chatHistory, newChatroom]);
      setIsSendToUser(false);
      setCurrentChat(newChatroom);
      setIsUserInChatroom(true);
    }
  }

  return (
    <div>
      {!isUserInChatroom ? (
        <div>
          <h1>{user.username}</h1>
          <div id="chat-history">
            {chatHistory.map((chat) => {
              return (
                <div key={chat.id}>
                  <img
                    className="profile-picture"
                    src={chat.imageURL}
                    alt={`${chat.name} profile`}
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
                  Enter Chat
                </button>
              </div>
            )}
          </div>
          <div>
            <Button id="send-to-user-btn" onClick={SendToUser}>
              {!isSendToUser ? "+" : "X"}
            </Button>
          </div>
        </div>
      ) : (
        <Chat
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          loggedUser={user}
          isUserInChatroom={isUserInChatroom}
          setIsUserInChatroom={setIsUserInChatroom}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        ></Chat>
      )}
      <div />
    </div>
  );
}

export default UserPage;
