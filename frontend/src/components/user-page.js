import React, { useEffect, useState } from "react";
import Axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Chat from "./chat";
import { Button } from "react-bootstrap";

function UserPage({ user, setUser, setLoggedIn }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [isUserInChatroom, setIsUserInChatroom] = useState(false);
  const [currentChat, setCurrentChat] = useState({});
  const [searchError, setSearchError] = useState("");

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

  function userInConversation() {
    return currentChat !== null || currentChat !== undefined;
  }

  function logout() {
    setUser({});
    setLoggedIn(false);
  }

  async function enterChatRoom() {
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
      const temporaryChatId = uuidv4();
      const newChatroom = {
        id: temporaryChatId,
        members: [user._id, userData._id],
        isGroupChat: false,
        name: userData.username,
        imageURL: userData.imageURL,
      };
      setChatHistory([...chatHistory, newChatroom]);
      setCurrentChat(newChatroom);
      setIsUserInChatroom(true);
    } else if (groupChatData) {
      const newChatroom = {
        id: groupChatData._id,
        members: groupChatData.members,
        isGroupChat: true,
        name: groupChatData.groupChatName,
        imageURL: groupChatData.groupChatPicture,
      };
      setChatHistory([...chatHistory, newChatroom]);
      setCurrentChat(newChatroom);
      setIsUserInChatroom(true);
    } else setSearchError("No search results found");
  }

  return (
    <div>
      {!userInConversation() ? (
        <div>
          <Button onClick={logout}>logout</Button>
          <h1>{user.username}</h1>
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
              onClick={enterChatRoom}
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
