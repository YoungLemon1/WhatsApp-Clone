import React, { useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Axios from "axios";
import Signup from "./signup";
import { API_URL } from "../constants";
import { Input, InputAdornment, IconButton } from "@mui/material";
import { Icon } from "react-icons-kit";
import { eye, eyeOff } from "react-icons-kit/feather";
function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState();
  const [passwordShown, setPasswordShown] = useState(false);
  const [passwordError, setPasswordError] = useState();
  const [error, setError] = useState("");
  const [icon, setIcon] = useState(eye);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleTogglePasswordHidden = () => {
    const newIcon = !passwordShown ? eyeOff : eye;
    setPasswordShown(!passwordShown);
    setIcon(newIcon);
  };

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
    <Container className="form-container login-container">
      <Form id="login" className="user-form">
        <h1 id="app-header">Chat and Play</h1>
        <Container id="error-container">{error}</Container>
        <Container>
          <label htmlFor="username">Username</label>
          <Input
            id="username"
            name="username"
            required
            disableUnderline={true}
            onChange={(event) => {
              setUsername(event.target.value);
              setUsernameError("");
            }}
          ></Input>
        </Container>
        <small>{usernameError}</small>
        <Container>
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            name="password"
            type={passwordShown ? "text" : "password"}
            required
            disableUnderline={true}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  className="icon-button"
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordHidden}
                  edge="end"
                >
                  <Icon icon={icon} />
                </IconButton>
              </InputAdornment>
            }
          ></Input>
        </Container>
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
      </Form>
      {showSignupModal && <Signup closeModal={closeModal}></Signup>}
      {showSignupModal && <div className="overlay" onClick={closeModal}></div>}
    </Container>
  );
}

export default Login;
