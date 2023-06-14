import React, { useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
function Login({ setUser, setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState();
  const [passwordError, setPasswordError] = useState();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function loginUser() {
    if (!username) {
      console.log("Error: empty username");
      setUsernameError("Please enter your username");
      return;
    } else if (!password) {
      console.log("Error: empty password");
      setPasswordError("Please enter your password");
      return;
    }
    try {
      const res = await Axios.post("http://localhost:5000/users/auth", {
        username,
        password,
      });
      const data = res.data;
      console.log(data);
      await setUser(data);
      setUsername("");
      setUsernameError("");
      setPasswordError("");
      setLoggedIn(true);
      console.log(`User ${data.username} logged in successfully`);
    } catch (error) {
      console.error("Error fetching user", error);
      setError("Username or password are incorrect. Please try again.");
    }
  }

  function routeToSignup() {
    navigate("/signup");
  }
  return (
    <div className="form-container">
      <form id="login" className="user-form">
        <h1>Chat and Play</h1>
        <Container id="error-container">{error}</Container>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          required
          onChange={(event) => {
            setUsername(event.target.value);
            setUsernameError("");
          }}
        ></input>
        <small>{usernameError}</small>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          required
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError("");
          }}
        ></input>
        <small>{passwordError}</small>
        <div>
          <Button className="submit-btn" variant="success" onClick={loginUser}>
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
