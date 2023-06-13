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
      <p>id: {user._id}</p>
      <p>name: {user.name}</p>
      <p>username: {user.username}</p>
      <p>birthdate: {dateFormat(user.birthdate)}</p>
    </div>
  );
}

export default UserPage;
