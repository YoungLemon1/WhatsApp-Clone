import React from "react";
import { useState } from "react";
import Axios from "axios";
import DatePicker from "react-datepicker";

function NewUser({ users, addUser }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState();
  const role = "user";

  const handleBirthDateChange = (date) => {
    setBirthdate(date);
  };

  async function usernameExists(username) {
    try {
      return users.some((user) => username === user.username);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  const createUser = async (event) => {
    event.preventDefault();

    if (!name || !username) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const usernameTaken = await usernameExists(username);
      if (usernameTaken) {
        alert(`Username ${username} is already taken.`);
        return;
      }

      const user = { name, username, birthdate, role };
      await Axios.post("http://localhost:5000/users", user);

      addUser(user);
      alert("User created");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Request failed after post");
    }
  };
  return (
    <div>
      <form onSubmit={createUser}>
        <h3>Create New User</h3>
        <div>
          <label>Name</label>
          <input
            required
            id="name"
            name="name"
            onChange={(e) => setName(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Username</label>
          <input
            required
            id="username"
            name="username"
            onChange={(e) => setUsername(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Birthdate (DD/MM/YYYY)</label>
          <DatePicker
            selected={birthdate}
            dateFormat="dd/MM/yyyy"
            showDayMonthYearPicker
            onChange={handleBirthDateChange}
          ></DatePicker>
        </div>
        <button id="save-btn" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}

export default NewUser;