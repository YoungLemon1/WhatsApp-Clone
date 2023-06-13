import React from "react";
import moment from "moment";

function UserPage({ user }) {
  return (
    <div>
      <h1>{user.username}</h1>
      <p>id: {user._id}</p>
      <p>name: {user.name}</p>
      <p>username: {user.username}</p>
      <p>birthdate: {moment(user.birthdate).format("DD-MM-YYYY")}</p>
    </div>
  );
}

export default UserPage;
