import React from "react";
import moment from "moment";

function UserPage({ user }) {
  function dateFormat(date) {
    if (date) {
      return moment(date).format("DD-MM-YYYY");
    } else return "";
  }
  return (
    <div>
      <h1>{user.username}</h1>
      <div id="chat-history"></div>
    </div>
  );
}

export default UserPage;
