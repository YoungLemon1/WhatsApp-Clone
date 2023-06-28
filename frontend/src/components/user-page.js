import React, { useEffect, useState } from "react";
import Axios from "axios";
import Chat from "./chat";
import moment from "moment";
import { Button } from "react-bootstrap";
import ChatHistory from "./chatHistory";

function UserPage({ loggedUser, setLoggedUser, setLoggedIn }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [isUserInChat, setIsUserInChat] = useState(false);
  const [currentChat, setCurrentChat] = useState({});
  const [searchError, setSearchError] = useState("");

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:mm");
    } else return "";
  }

  function logout() {
    console.log(`${loggedUser.username} logged out successefully`);
    setLoggedUser({});
    setLoggedIn(false);
  }

  async function tryEnterChatroom() {
    if (!chatSearch) {
      return;
    }
    const chat = chatHistory.find((c) => c.name === chatSearch);
    if (chat) {
      enterChat(chat);
      return;
    }

    let userData;
    let chatroomData;

    try {
      const resUserSearch = await Axios.get(
        `http://localhost:5000/users/search/${chatSearch}`
      );
      userData = resUserSearch.data;
    } catch (error) {
      console.error("user search error", error);
      // Handle the error for the user search API request
    }

    try {
      const resGroupChatSearch = await Axios.get(
        `http://localhost:5000/chatrooms/search/${chatSearch}`
      );
      chatroomData = resGroupChatSearch.data;
    } catch (error) {
      console.error("chatroom search error", error);
      // Handle the error for the group chat search API request
    }

    console.log("user data", userData);
    console.log("group data", chatroomData);

    if (userData) {
      const userChat = {
        id: userData._id,
        name: userData.username,
        imageURL: userData.imageURL,
        isGroupChat: false,
      };
      setChatHistory([...chatHistory, userChat]);
      enterChat(userChat);
    } else if (chatroomData) {
      const chatroom = {
        id: chatroomData._id,
        members: chatroomData.members,
        name: chatroomData.groupChatName,
        imageURL: chatroomData.groupChatPicture,
        isGroupChat: true,
      };
      setChatHistory([...chatHistory, chatroom]);
      enterChat(chatroom);
    } else setSearchError("No search results found");
  }

  function enterChat(chat) {
    setCurrentChat(chat);
    setIsUserInChat(true);
  }

  return (
    <div id="user-page">
      {!isUserInChat ? (
        <div>
          <div id="logout-container">
            <Button id="logout" onClick={logout}>
              logout
            </Button>
          </div>
          <div id="loged-user-username">
            <h1>{loggedUser.username}</h1>
          </div>
          <div id="chat-search">
            <label htmlFor="chat-search-bar">Chat with a user or a group</label>
            <input
              id="chat-search-bar"
              onChange={(event) => {
                setChatSearch(event.target.value);
                setSearchError("");
              }}
              onKeyDown={(event) => {
                event.key === "Enter" && tryEnterChatroom();
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
          <ChatHistory
            loggedUserID={loggedUser._id}
            dateFormat={dateFormat}
            enterChat={enterChat}
          ></ChatHistory>
        </div>
      ) : (
        <Chat
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          loggedUser={loggedUser}
          isUserInChatroom={isUserInChat}
          setIsUserInChatroom={setIsUserInChat}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          dateFormat={dateFormat}
        ></Chat>
      )}
      <div />
    </div>
  );
}

export default UserPage;
