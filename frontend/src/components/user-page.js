import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import Chat from "./chat";
import moment from "moment";
import { Button } from "react-bootstrap";
import { io } from "socket.io-client";
import ChatHistory from "./chatHistory";

function UserPage({ user, setUser }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [chatHistoryLoading, setChatHistoryLoading] = useState(true);
  const socket = useRef(null);

  useEffect(() => {
    // Initialize the socket connection
    socket.current = io("http://localhost:5000");
    // Clean up the socket connection on component unmount
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const userId = user._id.toString();
    socket.current.emit("user_connected", userId);
  }, [user._id]);

  useEffect(() => {
    if (!socket) return;
    // Fetch the initial chat history
    async function fetchChatHistory() {
      try {
        const userId = user._id.toString();
        const res = await Axios.get(
          `http://localhost:5000/messages/last-messages?userID=${userId}`
        );
        const data = res.data;
        setChatHistory(data);
        console.log("successfully fetched user chat history", data);
      } catch (error) {
        console.error("Failed to fetch user chat history", error);
      }
      setChatHistoryLoading(false);
    }

    // Fetch the initial chat history and add event listener on socket change
    fetchChatHistory();

    // Fetch the initial chat history and add event listener on socket change
  }, [socket, setChatHistory, user._id]);

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:mm");
    } else return "";
  }

  function logout() {
    console.log(`${user.username} logged out successefully`);
    setUser(null);
  }

  async function tryEnterChat() {
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
      const resChatroomSearch = await Axios.get(
        `http://localhost:5000/chatrooms?chatroomTitle=${searchText}`
      );
      chatroomData = resChatroomSearch.data;
    } catch (error) {
      console.error("chatroom search error", error);
      // Handle the error for the group chat search API request
    }

    console.log("user data", userData);
    console.log("group data", chatroomData);

    if (userData) {
      const members = [user._id, userData._id];
      const sortedMembers = members.map((member) => member.toString()).sort();
      console.log("sorted", sortedMembers);
      const tempChatId = sortedMembers.reduce(
        (acc, member) => acc + member,
        ""
      );
      console.log("tempId", tempChatId);
      const userChat = {
        id: tempChatId,
        members: members,
        title: userData.username,
        imageURL: userData.imageURL,
        isGroupChat: false,
        newChat: true,
      };
      setChatHistory([...chatHistory, userChat]);
      enterChat(userChat);
    } else if (chatroomData) {
      const chatroom = {
        id: chatroomData._id,
        members: chatroomData.members,
        title: chatroomData.title,
        imageURL: chatroomData.imageURL,
        isGroupChat: true,
      };
      setChatHistory([...chatHistory, chatroom]);
      enterChat(chatroom);
    } else setSearchError("No search results found");
  }

  function enterChat(chat) {
    setSearchText("");
    socket.current.emit("join_room", chat.id);
    setCurrentChat(chat);
    console.log(`${user.username} entered chat ${chat.id}`);
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
                className="search-bar"
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setSearchError("");
                }}
                onKeyDown={(event) => {
                  event.key === "Enter" && tryEnterChat();
                }}
                placeholder="Chat with a user or a group"
              ></input>
              <button
                className="submit-btn"
                disabled={searchText === ""}
                onClick={tryEnterChat}
              >
                Enter Chat
              </button>
            </div>
            <div className="search-error">{searchError}</div>
          </div>
          <ChatHistory
            chatHistory={chatHistory}
            socket={socket.current}
            setChatHistory={setChatHistory}
            chatHistoryLoading={chatHistoryLoading}
            setChatHistoryLoading={setChatHistoryLoading}
            loggedUserID={user._id}
            dateFormat={dateFormat}
            enterChat={enterChat}
          ></ChatHistory>
        </div>
      ) : (
        <Chat
          chat={currentChat}
          setCurrentChat={setCurrentChat}
          socket={socket.current}
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
