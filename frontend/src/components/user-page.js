import React, { useEffect, useState, useRef } from "react";
import Axios from "axios";
import Chat from "./chat";
import moment from "moment";
import { Button } from "react-bootstrap";
import { io } from "socket.io-client";
import ChatHistory from "./chatHistory";
import { API_URL } from "../constants";
import { BsFillChatRightTextFill } from "react-icons/bs";

function UserPage({ user, setUser }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isChatHistoryEmpty, setIsChatHistoryEmpty] = useState(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(true);
  const socket = useRef(null);

  //#region lifecycle functions
  useEffect(() => {
    // Initialize the socket connection
    socket.current = io(API_URL);
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
          `${API_URL}/messages/user-chat-history?userId=${userId}`
        );
        const data = res.data;
        setChatHistory(data);
        console.log("successfully fetched user chat history", data);
        if (data.length === 0) setIsChatHistoryEmpty(true);
      } catch (error) {
        console.error("Failed to fetch user chat history", error);
      }
      setChatHistoryLoading(false);
    }

    // Fetch the initial chat history and add event listener on socket change
    fetchChatHistory();

    // Fetch the initial chat history and add event listener on socket change
  }, [socket, setChatHistory, user._id]);

  useEffect(() => {
    if (!socket) return;

    function getChatIndex(chatHistory, chatId) {
      return chatHistory.findIndex((chat) => chat.id === chatId);
    }

    const handleUpdateChatHistory = (
      message,
      senderProfileData,
      chatProfileData,
      chatId,
      chatStrObjectId,
      members,
      isGroupChat
    ) => {
      setIsChatHistoryEmpty(false);
      setChatHistory((prevChatHistory) => {
        const chatIndex = getChatIndex(prevChatHistory, chatId);
        const isExistingChat = chatIndex !== -1;
        if (isExistingChat) {
          const updatedChat = {
            ...prevChatHistory[chatIndex],
            lastMessage: message,
          };
          if (message.isHumanSender) {
            return [
              updatedChat,
              ...prevChatHistory.filter((chat) => chat.id !== chatId),
            ];
          } else {
            // If the sender is the system, just update the lastMessage
            const updatedChatHistory = [...prevChatHistory];
            updatedChatHistory[chatIndex] = updatedChat;
            return updatedChatHistory;
          }
        } else {
          const newChatProfile =
            message.sender === user._id ? chatProfileData : senderProfileData;
          const newChat = {
            id: chatId,
            strObjectId: chatStrObjectId,
            members,
            isGroupChat,
            title: newChatProfile.title,
            imageURL: newChatProfile.imageURL,
            lastMessage: message,
          };
          return [newChat, ...prevChatHistory];
        }
      });
    };

    socket.current.on("update_chat_history", handleUpdateChatHistory);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.current.off("update_chat_history", handleUpdateChatHistory);
    };
  }, [socket, user._id]);

  useEffect(() => {
    console.log("current chat", currentChat);
    if (currentChat)
      console.log(`${user.username} entered chat ${currentChat.id}`);
  }, [currentChat, user.username]);
  //#endregion

  //#region enter chat functions
  function enterChat(chat) {
    setSearchText("");
    console.log("composed chat", chat);
    console.log("chat id", chat.id);
    console.log("chat isGroupChat", chat.isGroupChat);
    console.log("chat members", chat.members);
    socket.current.emit("join_room", chat.id);
    setCurrentChat(chat);
  }

  async function tryEnterChat() {
    if (!searchText) {
      return;
    }
    const searchChat = chatHistory.find((c) => c.title === searchText);
    if (searchChat) {
      const isGroupChat = searchChat.id.length > 24;
      const chat = {
        ...searchChat,
        isGroupChat: isGroupChat,
      };
      enterChat(chat);
      return;
    }

    let userData;
    let chatroomData;

    try {
      const resUserSearch = await Axios.get(
        `${API_URL}/users?username=${searchText}`
      );
      userData = resUserSearch.data;
    } catch (error) {
      console.error("user search error", error);
      // Handle the error for the user search API request
    }

    try {
      const resChatroomSearch = await Axios.get(
        `${API_URL}/chatrooms?chatroomTitle=${searchText}`
      );
      chatroomData = resChatroomSearch.data;
    } catch (error) {
      console.error("chatroom search error", error);
      // Handle the error for the group chat search API request
    }

    console.log("user data", userData);
    console.log("group data", chatroomData);

    let newChat;
    if (userData) {
      const members = [user._id, userData._id];
      const sortedMembers = members.map((member) => member.toString()).sort();
      console.log("sorted", sortedMembers);
      const conversationId = sortedMembers.reduce(
        (acc, member) => acc + member,
        ""
      );
      const conversation = {
        id: conversationId,
        strObjectId: null,
        members: sortedMembers,
        title: userData.username,
        imageURL: userData.imageURL,
        isGroupChat: false,
        new: true,
      };
      newChat = conversation;
    } else if (chatroomData) {
      const chatroomId = chatroomData._id.toString();
      const chatroom = {
        id: chatroomId,
        strObjectId: chatroomId,
        members: chatroomData.members,
        title: chatroomData.title,
        imageURL: chatroomData.imageURL,
        isGroupChat: true,
        new: true,
      };
      newChat = chatroom;
    }
    if (newChat) enterChat(newChat);
    else setSearchError("No search results found");
  }
  //#endregion

  function dateFormat(date) {
    if (date) {
      return moment(date).format("HH:mm");
    } else return "";
  }

  function logout() {
    console.log(`${user.username} logged out successefully`);
    setUser(null);
  }

  return (
    <div id="user-page">
      {!currentChat ? (
        <div>
          <div>
            <img
              className="profile-img"
              src={user.imageURL}
              alt="user profile"
            ></img>
            <h5
              id="profile-header"
              style={{ display: "inline", float: "left", margin: "0.5rem" }}
            >
              {user.username}
            </h5>
          </div>
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
          {isChatHistoryEmpty && (
            <div id="no-messages-placeholder">
              <BsFillChatRightTextFill id="placeholder-icon" />
              <h2>
                No messages Yet. Be the first one to start a conversation!
              </h2>
            </div>
          )}
          <ChatHistory
            chatHistory={chatHistory}
            chatHistoryLoading={chatHistoryLoading}
            setChatHistoryLoading={setChatHistoryLoading}
            loggedUserId={user._id}
            dateFormat={dateFormat}
            enterChat={enterChat}
          ></ChatHistory>
        </div>
      ) : (
        <Chat
          currentChat={currentChat}
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
