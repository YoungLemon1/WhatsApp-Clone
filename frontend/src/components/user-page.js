import React, { useState } from "react";
import moment from "moment";

function UserPage({ user }) {
  const [chats, setChats] = useState();
  /*function dateFormat(date) {
    if (date) {
      return moment(date).format("DD-MM-YYYY");
    } else return "";
  }*/
  return (
    <div>
      <h1>{user.username}</h1>
      <div id="chat-history">{chats.map()}</div>
    </div>
  );
}

export default UserPage;
