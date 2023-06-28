import React from "react";
import { useState } from "react";
import Axios from "axios";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "react-datepicker";
function Signup({ closeModal }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
  function validatePassword(password) {
    // Regex pattern to match the password requirements
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

    return passwordRegex.test(password);
  }

  const createUser = async (event) => {
    event.preventDefault();
    if (!username) {
      console.error("Error: empty username");
      setUsernameError("Please enter your username");
      return;
    } else if (!password) {
      console.error("Error: empty password");
      setPasswordError("Please enter your password");
      return;
    } else if (password !== passwordConfirmation) {
      console.error("Error: passwords don't match");
      return;
    } else if (!validatePassword(password)) {
      console.error("invalid password");
      return;
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
      const res = await Axios.post("http://localhost:5000/users", user);

      if (res.data.message) {
        setUsernameError(`Username ${username} already exists`);
        return;
      }

      alert("User created");
      closeModal();
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Request failed");
    }
  };

  return (
    <div className="form-container">
      <form id="signup-modal" className="user-form" onSubmit={createUser}>
        <button className="close-button" onClick={closeModal}>
          X
        </button>
        <h3>Create New User</h3>
        <label htmlFor="username">Username</label>
        <input
          required
          minLength={2}
          id="username"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
        ></input>
        <small>{usernameError}</small>
        <label htmlFor="password">Password</label>
        <input
          required
          minLength={6}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          onChange={(event) => {
            const newPassword = event.target.value;
            setPassword(newPassword);
            if (newPassword && !validatePassword(newPassword)) {
              setPasswordError(
                "Password must have at least 6 characters, including one lowercase letter, one uppercase letter, and one number."
              );
            } else {
              setPasswordError("");
            }
            if (passwordConfirmation && newPassword !== passwordConfirmation) {
              setPasswordConfirmationError("Passwords must match");
            } else {
              setPasswordConfirmationError("");
            }
          }}
        ></input>
        <small>{passwordError}</small>
        <label htmlFor="password-confirmation">Password confirmation</label>
        <input
          required
          minLength={6}
          id="password-confirmation"
          name="password-confirmation"
          type="password"
          autoComplete="new-password-confirmation"
          onChange={(event) => {
            const newPasswordConfirmation = event.target.value;
            setPasswordConfirmation(newPasswordConfirmation);
            if (password !== newPasswordConfirmation) {
              setPasswordConfirmationError("Passwords must match");
            } else {
              setPasswordConfirmationError("");
            }
          }}
        ></input>
        <small>{passwordConfirmationError}</small>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          onChange={(event) => setEmail(event.target.value)}
        ></input>
        <label htmlFor="imageURL">Image URl</label>
        <input
          id="imageURL"
          name="imageURL"
          type="url"
          onChange={(event) => setImageURL(event.target.value)}
        ></input>
        <label htmlFor="birthdate">Birthdate</label>
        <DatePicker
          id="birthdate"
          name="birthdate"
          selected={birthdate}
          dateFormat="dd/MM/yyyy"
          showDayMonthYearPicker
          onChange={handleBirthDateChange}
        ></DatePicker>
        <Button className="submit-btn" type="submit" variant="success">
          Sign Up
        </Button>
      </form>
    </div>
  );
}

export default Signup;
