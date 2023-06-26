import React, { useEffect, useState } from "react";
import Axios from "axios";
import Chat from "./chat";
import { Button } from "react-bootstrap";

function UserPage({ loggedUser, setUser, setLoggedIn }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [isUserInChatroom, setIsUserInChatroom] = useState(false);
  const [currentChat, setCurrentChat] = useState({});
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    async function fetchData() {
      let result = [];
      try {
        const res = await Axios.get(
          `http://localhost:5000/chatrooms/user/${loggedUser._id}`
        );
        result = result.concat(res.data);
        console.log("data:", res.data);
      } catch (error) {
        console.error("Failed to fetch chatroom messaging history", error);
      }
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages//user/conversations/${loggedUser._id}`
        );
        result = result.concat(res.data);
        console.log("data:", res.data);
      } catch (error) {
        console.error(
          "Failed to fetch one on one user messaging history",
          error
        );
      }
      result.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
      setChatHistory(result);
    }
    fetchData();
  }, [loggedUser._id]);
  /*function dateFormat(date) {
    if (date) {
      return moment(date).format("DD-MM-YYYY");
    } else return "";
  }*/

  function logout() {
    setUser({});
    setLoggedIn(false);
  }

  async function tryEnterChatroom() {
    if (!chatSearch) {
      return;
    }
    const chat = chatHistory.find((c) => c.name === chatSearch);
    if (chat) {
      setCurrentChat(chat);
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
      const userChat = {
        id: userData._id,
        name: userData.username,
        imageURL: userData.imageURL,
      };
      enterChat(userChat);
    } else if (groupChatData) {
      const chatroom = {
        id: groupChatData._id,
        members: groupChatData.members,
        name: groupChatData.groupChatName,
        imageURL: groupChatData.groupChatPicture,
      };
      enterChat(chatroom);
    } else setSearchError("No search results found");
  }

  function enterChat(chat) {
    setChatHistory([...chatHistory, chat]);
    setCurrentChat(chat);
    setIsUserInChatroom(true);
  }

  return (
    <div>
      {!isUserInChatroom ? (
        <div>
          <Button onClick={logout}>logout</Button>
          <h1>{loggedUser.username}</h1>
          <div id="chat-history">
            {chatHistory.map((chat) => {
              return (
                <div key={chat.id}>
                  <img
                    className="profile-img"
                    src={chat.imageURL}
                    alt={`${chat.name} profile`}
                  ></img>
                </div>
              );
            })}
          </div>
          <div id="send-message-to-user">
            <label htmlFor="chat-name">Chat with user or group</label>
            <input
              id="chat-name"
              onChange={(event) => {
                setChatSearch(event.target.value);
                setSearchError("");
              }}
            ></input>
            <button
              className="submit-btn"
              disabled={chatSearch === ""}
              onClick={tryEnterChatroom}
            >
              Enter Chat
            </button>
            <div>{searchError}</div>
          </div>
        </div>
      ) : (
        <Chat
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          loggedUser={loggedUser}
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
