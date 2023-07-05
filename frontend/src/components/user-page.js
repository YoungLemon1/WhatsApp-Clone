import React, { useState } from "react";
import Axios from "axios";
import Chat from "./chat";
import moment from "moment";
import { Button } from "react-bootstrap";
import ChatHistory from "./chatHistory";

function UserPage({ user, setUser }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [searchError, setSearchError] = useState("");

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:mm");
    } else return "";
  }

  function logout() {
    console.log(`${user.username} logged out successefully`);
    setUser(null);
  }

  async function tryEnterChatroom() {
    if (!searchText) {
      return;
    }
    const chat = chatHistory.find((c) => c.name === searchText);
    if (chat) {
      enterChat(chat);
      return;
    }

    let userData;
    let chatroomData;

    try {
      const resUserSearch = await Axios.get(
        `http://localhost:5000/users?username=${searchText}`
      );
      userData = resUserSearch.data;
    } catch (error) {
      console.error("user search error", error);
      // Handle the error for the user search API request
    }

    try {
      const resGroupChatSearch = await Axios.get(
        `http://localhost:5000/chatrooms?chartroomName=${searchText}`
      );
      chatroomData = resGroupChatSearch.data;
    } catch (error) {
      console.error("chatroom search error", error);
      // Handle the error for the group chat search API request
    }

    console.log("user data", userData);
    console.log("group data", chatroomData);

    if (userData) {
      const members = [user._id, userData._id];
      const coversation = {
        members: members,
      };
      const res = await Axios.post(
        "http://localhost:5000/conversations",
        coversation
      );
      console.log(
        `conversation created with ${user.username} and ${userData.username}`,
        res.data
      );
      const userChat = {
        id: res.data._id.toString(),
        members: members,
        title: userData.username,
        imageURL: userData.imageURL,
        isGroupChat: false,
      };
      setChatHistory([...chatHistory, userChat]);
      enterChat(userChat);
    } else if (chatroomData) {
      const chatroom = {
        id: chatroomData._id,
        members: chatroomData.members,
        title: chatroomData.groupChatName,
        imageURL: chatroomData.groupChatPicture,
        isGroupChat: true,
      };
      setChatHistory([...chatHistory, chatroom]);
      enterChat(chatroom);
    } else setSearchError("No search results found");
  }

  function enterChat(chat) {
    setSearchText("");
    setCurrentChat(chat);
  }

  return (
    <div id="user-page">
      {!currentChat ? (
        <div>
          <div id="logout-container">
            <Button id="logout" onClick={logout}>
              logout
            </Button>
          </div>
          <div id="loged-user-username"></div>
          <div className="chat-search">
            <div>
              <input
                id="chat-search-bar"
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setSearchError("");
                }}
                onKeyDown={(event) => {
                  event.key === "Enter" && tryEnterChatroom();
                }}
                placeholder="Chat with a user or a group"
              ></input>
              <button
                className="submit-btn"
                disabled={searchText === ""}
                onClick={tryEnterChatroom}
              >
                Enter Chat
              </button>
            </div>
            <div className="search-error">{searchError}</div>
          </div>
          <ChatHistory
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            loggedUserID={user._id}
            dateFormat={dateFormat}
            enterChat={enterChat}
          ></ChatHistory>
        </div>
      ) : (
        <Chat
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          loggedUser={user}
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
