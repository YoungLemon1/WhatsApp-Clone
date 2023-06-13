import React, { useState } from "react";
import { Button, Container, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
function Login({ setUser, setLoggedIn }) {
  const [usernameFooter, setUsernameFooter] = useState();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
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
      const data = res.data;
      console.log(data);
      if (data === null) {
        setError("Username or password is incorrect. Please try again.");
        return;
      }
      await setUser(data);
      setUsername("");
      setUsernameFooter("");
      setLoggedIn(true);
      console.log(`User ${data.username} logged in successfully`);
    } catch (error) {
      console.error("Error fetching user", error);
      setError("An error occurred. Please try again later.");
    }
  }
  return (
    <Container id="login">
      <h1>Chat and Play</h1>
      <Container id="error-container">{error}</Container>
      <Container>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          onChange={(event) => {
            setUsername(event.target.value);
            setUsernameFooter("");
          }}
        ></input>
        <small>{usernameFooter}</small>
      </Container>
      <Container>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" disabled></input>
      </Container>
      <Button id="login" name="login" variant="success" onClick={loginUser}>
        login
      </Button>
    </Container>
  );
}

export default Login;
