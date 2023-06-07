import "./App.css";
import moment from "moment";
import { useEffect, useState } from "react";
import Axios from "axios";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState();

  useEffect(() => {
    Axios.get("http://localhost:5000/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  const createUser = () => {
    try {
      Axios.post("http://localhost:5000/users", {
        name: name,
        username: username,
        birthdate: birthdate,
        role: "user",
      })
        .then((res) => {
          alert("User created");
        })
        .catch((error) => {
          if (
            error.response &&
            error.response.data &&
            error.response.data.errors
          ) {
            const errorMessages = error.response.data.errors.map(
              (err) => err.msg
            );
            alert(errorMessages.join("\n"));
          } else {
            alert("Request failed after post");
          }
        });
    } catch {
      alert("Request failed");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
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
                <tr key={val._id}>
                  <td>{val.name}</td>
                  <td>{val.username}</td>
                  <td>{birthdate}</td>
                  <td>{val.role}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <form>
          <h3>Create New User</h3>
          <label>Name</label>
          <input
            required
            id="name"
            name="name"
            onChange={(e) => setName(e.target.value)}
          ></input>
          <label>username</label>
          <input
            required
            id="username"
            name="username"
            onChange={(e) => setUsername(e.target.value)}
          ></input>
          <label>Birthdate</label>
          <DatePicker
            id="birthdate"
            name="birthdate"
            selected={birthdate}
            onChange={(date) => setBirthdate(date)}
          ></DatePicker>
          <button id="save-btn" onClick={createUser}>
            Save
          </button>
        </form>
      </header>
    </div>
  );
}

export default App;
