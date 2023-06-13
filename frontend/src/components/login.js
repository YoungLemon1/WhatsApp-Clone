import React, { useState } from "react";
import { Button, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
function Login({ setUser, setLoggedIn }) {
  const [usernameFooter, setUsernameFooter] = useState();
  const [username, setUsername] = useState("");
  async function loginUser() {
    if (!username) {
      console.log("Error: empty username");
      setUsernameFooter("Please enter your username");
      return;
    }
    try {
      const res = await Axios.get(
        `http://localhost:5000/users/username/${username}`
      );
      const user = res.data;
      console.log(user);
      if (user === null) {
        alert("username or password are incorrect, try again");
        return;
      }
      setUser(user);
      setLoggedIn(true);
      setUsernameFooter("");
      console.log(`user ${user.username} logged in successfully`);
    } catch (error) {
      console.error("error fetching user", error);
      throw error;
    }
  }
  return (
    <Container id="login">
      <h1>Chat and Play</h1>
      <Container>
        <label id="username">Username</label>
        <input
          id="username"
          name="username"
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        ></input>
        <small>{usernameFooter}</small>
      </Container>
      <Container>
        <label id="password">Password</label>
        <input id="password" name="password" disabled></input>
      </Container>
      <Button id="login" name="login" variant="success" onClick={loginUser}>
        login
      </Button>
    </Container>
  );
}

export default Login;
