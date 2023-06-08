import "./App.css";
import moment from "moment";
import { useEffect, useState } from "react";
import Axios from "axios";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

function App() {
  const role = "user";
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState();

  useEffect(() => {
    Axios.get("http://localhost:5000/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  async function usernameExists(username) {
    try {
      const res = await Axios.get("http://localhost:5000/users");
      const usersList = res.data;
      return usersList.some((user) => username === user.username);
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

      setUsers([...users, user]);
      alert("User created");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Request failed after post");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
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
            <label>Birthdate</label>
            <DatePicker
              id="birthdate"
              name="birthdate"
              selected={birthdate}
              onChange={(date) => setBirthdate(date)}
            ></DatePicker>
          </div>
          <button id="save-btn" type="submit">
            Save
          </button>
        </form>
      </header>
    </div>
  );
}

export default App;
