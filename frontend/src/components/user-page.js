import React, { useEffect, useState } from "react";
import Axios from "axios";
import Chat from "./chat";
import moment from "moment";
import { Button } from "react-bootstrap";

function UserPage({ loggedUser, setLoggedUser, setLoggedIn }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [isUserInChat, setIsUserInChat] = useState(false);
  const [currentChat, setCurrentChat] = useState({});
  const [searchError, setSearchError] = useState("");
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await Axios.get(
          `http://localhost:5000/messages/chat-history/${loggedUser._id}`
        );
        const data = res.data;
        setChatHistory(data);
        console.log("successfully fetched user chat history", data);
      } catch (error) {
        console.error("Failed to fetch user chat history", error);
      }
    }
    fetchData();
  }, [loggedUser._id]);

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:MM");
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
          <Button id="logout" onClick={logout}>
            logout
          </Button>
          <h1>{loggedUser.username}</h1>
          <div id="send-message-to-user">
            <label htmlFor="chat-search-bar">Chat with a user or a group</label>
            <input
              id="chat-search-bar"
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
          <div id="chat-history">
            {chatHistory.map((chat) => {
              const sender =
                chat.lastMessage.sender === loggedUser._id ? "You: " : "";
              return (
                <div className="chat-history-item" key={chat.id}>
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
        ></Chat>
      )}
      <div />
    </div>
  );
}

export default UserPage;
