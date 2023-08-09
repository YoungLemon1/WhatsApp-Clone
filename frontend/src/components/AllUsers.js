import React from "react";
import moment from "moment";
import Axios from "axios";
import { API_URL } from "../constants";
function AllUsers() {
  const res = Axios.get(`${API_URL}/users`);
  const users = res.data;
  return (
    <div id="all-users">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Birthdate</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const birthdate =
              user.birthdate === undefined
                ? ""
                : moment(user.birthdate).format("DD-MM-YYYY");
            return (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{birthdate}</td>
                <td>{user.role}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AllUsers;
