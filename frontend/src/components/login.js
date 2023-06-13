import React, { useState } from "react";
import { Button, Container, Link } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
function Login({ setUser, setLoggedIn }) {
  const [usernameFooter, setUsernameFooter] = useState();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
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
  function routeToSignup() {
    navigate("/signup");
  }
  return (
    <div>
      <form id="login" className="user-form">
        <h1>Chat and Play</h1>
        <Container id="error-container">{error}</Container>
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
        <label htmlFor="password">Password</label>
        <input id="password" name="password" disabled></input>
        <div>
          <Button id="login" name="login" variant="success" onClick={loginUser}>
            login
          </Button>
          <Button
            id="signup"
            name="signup"
            variant="primary"
            onClick={routeToSignup}
          >
            Create account
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Login;
