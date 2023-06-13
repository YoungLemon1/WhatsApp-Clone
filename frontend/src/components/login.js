import React, { useState } from "react";
import { Button, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
function Login({ socket, username, setUsername, setId }) {
  const [usernameFooter, setUsernameFooter] = useState();
  function loginUser() {
    if (!username) {
      setUsernameFooter("Please enter your username");
      return;
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
      <Button id="login" name="login" variant="success">
        login
      </Button>
    </Container>
  );
}

export default Login;
