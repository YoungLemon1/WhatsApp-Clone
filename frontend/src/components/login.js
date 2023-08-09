import React, { useState } from "react";
import { Button, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
import Signup from "./signup";
import { API_URL } from "../constants";
function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState();
  const [passwordError, setPasswordError] = useState();
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);

  const openModal = () => {
    setShowSignupModal(true);
  };

  const closeModal = () => {
    setShowSignupModal(false);
  };

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
      const res = await Axios.post(`${API_URL}/users/auth`, {
        username,
        password,
      });
      const data = res.data;
      await setUser(data);
      resetFields();
      console.log(`User ${data.username} logged in successfully`);
      console.log(data);
    } catch (error) {
      console.error("Error fetching user", error);
      setError("Username or password are incorrect. Please try again.");
    }
  }

  function resetFields() {
    setUsername("");
    setUsernameError("");
    setPassword("");
    setPasswordError("");
  }

  return (
    <div className="form-container login-container">
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
          type="password"
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
            onClick={openModal}
          >
            Create account
          </Button>
        </div>
      </form>
      {showSignupModal && <Signup closeModal={closeModal}></Signup>}
      {showSignupModal && <div className="overlay" onClick={closeModal}></div>}
    </div>
  );
}

export default Login;
