import React from "react";
import moment from "moment";
function AllUsers({ users }) {
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
          {users.map((val) => {
            const birthdate =
              val.birthdate === undefined
                ? ""
                : moment(val.birthdate).format("DD-MM-YYYY");
            return (
              <tr key={val.username}>
                <td>{val.name}</td>
                <td>{val.username}</td>
                <td>{birthdate}</td>
                <td>{val.role}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AllUsers;
