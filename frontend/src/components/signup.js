import React from "react";
import { useState } from "react";
import Axios from "axios";
import { Button, Container, Form } from "react-bootstrap";
import { DatePicker } from "@mui/x-date-pickers";
import "bootstrap/dist/css/bootstrap.min.css";
import { Input, InputAdornment, IconButton } from "@mui/material";
import { Icon } from "react-icons-kit";
import { eye, eyeOff } from "react-icons-kit/feather";
import { API_URL } from "../constants";
function Signup({ closeModal }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [icon, setIcon] = useState(eye);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmationError, setPasswordConfirmationError] =
    useState("");
  const [birthdate, setBirthdate] = useState();
  const [email, setEmail] = useState("");
  const [imageURL, setImageURL] = useState("");
  const role = "user";

  const handleBirthDateChange = (date) => {
    setBirthdate(date);
  };

  const handleTogglePasswordHidden = () => {
    const newIcon = !passwordShown ? eyeOff : eye;
    setPasswordShown(!passwordShown);
    setIcon(newIcon);
  };

  function validatePassword(password) {
    // Regex pattern to match the password requirements
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

    return passwordRegex.test(password);
  }

  function validateNewUser() {
    if (!username) {
      console.error("Error: empty username");
      return false;
    } else if (!password) {
      console.error("Error: empty password");
      return false;
    } else if (password !== passwordConfirmation) {
      console.error("Error: passwords don't match");
      return;
    } else if (!validatePassword(password)) {
      console.error("invalid password");
      return false;
    }
    return true;
  }

  function formErrorSetter() {
    if (!username) {
      setUsernameError("username is invalid");
    } else if (!password) {
      setPasswordError("password is invalid");
    } else if (password !== passwordConfirmation) {
      setPasswordConfirmationError("passwords must match");
    }
  }

  async function createUser(event) {
    event.preventDefault();
    if (!validateNewUser()) {
      formErrorSetter();
    }
    try {
      const user = {
        username,
        password,
        birthdate,
        email,
        imageURL,
        role,
      };

      if (imageURL === "") delete user.imageURL;
      if (email === "") delete user.email;
      console.log("new user", user);
      const res = await Axios.post(`${API_URL}/users`, user);
      console.log("user created", res.data);
      alert("User created");
      closeModal();
    } catch (error) {
      const res = error.response;
      console.error("Error creating user:", error);
      if (res && res.status === 409) {
        console.error("Username already exists", error);
        setUsernameError(`Username already exists`);
        return;
      }
    }
  }

  return (
    <Container className="form-container">
      <Form id="signup-modal" className="user-form" onSubmit={createUser}>
        <Button className="close-button" onClick={closeModal}>
          X
        </Button>
        <h3>Create New User</h3>
        <Container id="username-container" className="container">
          <label htmlFor="username">Username</label>
          <Input
            required
            minLength={2}
            id="username"
            name="username"
            className="required-field"
            disableUnderline={true}
            onChange={(event) => setUsername(event.target.value)}
          ></Input>
        </Container>
        <small>{usernameError}</small>
        <Container id="password-container" className="container">
          <label htmlFor="password">Password</label>
          <Input
            required
            minLength={6}
            id="password"
            name="password"
            className="required-field"
            disableUnderline={true}
            type={passwordShown ? "text" : "password"}
            autoComplete="new-password"
            onChange={(event) => {
              const currentPassword = event.target.value;
              setPassword(currentPassword);
              if (currentPassword && !validatePassword(currentPassword)) {
                setPasswordError(
                  "Password must have at least 6 characters: one lowercase letter, one uppercase letter, and one number."
                );
              } else {
                setPasswordError("");
              }
              if (
                passwordConfirmation &&
                currentPassword !== passwordConfirmation
              ) {
                setPasswordConfirmationError("Passwords must match");
              } else {
                setPasswordConfirmationError("");
              }
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
        <Container id="password-confirmation-container" className="container">
          <label htmlFor="password-confirmation">Password confirmation</label>
          <Input
            minLength={6}
            id="password-confirmation"
            name="password-confirmation"
            type="password"
            disableUnderline={true}
            autoComplete="current-password-confirmation"
            onChange={(event) => {
              const currentPasswordConfirmation = event.target.value;
              setPasswordConfirmation(currentPasswordConfirmation);
              if (password !== currentPasswordConfirmation) {
                setPasswordConfirmationError("Passwords must match");
              } else {
                setPasswordConfirmationError("");
              }
            }}
          ></Input>
          <small>{passwordConfirmationError}</small>
        </Container>
        <Container id="email-container" className="container">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            disableUnderline={true}
            onChange={(event) => setEmail(event.target.value)}
          ></Input>
        </Container>
        <Container id="imageURL-container" className="container">
          <label htmlFor="imageURL">Image URl</label>
          <Input
            id="imageURL"
            name="imageURL"
            type="url"
            disableUnderline={true}
            onChange={(event) => setImageURL(event.target.value)}
          ></Input>
        </Container>
        <Container id="birthdate-container" className="container">
          <label htmlFor="birthdate">Birthdate</label>
          <DatePicker
            id="birthdate"
            name="birthdate"
            className="date-picker"
            selected={birthdate}
            disableUnderline={true}
            onChange={handleBirthDateChange}
            format="DD-MM-YYYY"
          ></DatePicker>
        </Container>
        <Button className="submit-btn" type="submit" variant="success">
          Sign Up
        </Button>
      </Form>
    </Container>
  );
}

export default Signup;
