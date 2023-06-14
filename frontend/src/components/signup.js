import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "react-datepicker";
function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState();
  const [passwordError, setPasswordError] = useState();
  const [birthdate, setBirthdate] = useState();
  const [email, setEmail] = useState("");
  const [imageURL, setImageURL] = useState("");
  const role = "user";
  const navigate = useNavigate();
  const handleBirthDateChange = (date) => {
    setBirthdate(date);
  };
  function validatePassword(password) {
    // Regex pattern to match the password requirements
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

    return passwordRegex.test(password);
  }
  async function usernameExists(username) {
    try {
      const res = await Axios.get(
        `http://localhost:5000/users/username/${username}`
      );
      const data = res.data;
      console.log(data);
      return data !== null;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  const createUser = async (event) => {
    event.preventDefault();

    if (!name || !username || !password) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const usernameTaken = await usernameExists(username);
      if (usernameTaken) {
        alert(`Username ${username} is already taken.`);
        return;
      }

      const user = {
        name,
        username,
        password,
        birthdate,
        email,
        imageURL,
        role,
      };
      await Axios.post("http://localhost:5000/users", user);

      alert("User created");
      navigate("/");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Request failed");
    }
  };
  return (
    <div className="form-container">
      <form id="signup" className="user-form" onSubmit={createUser}>
        <h3>Create New User</h3>
        <label htmlFor="name">Name</label>
        <input
          required
          id="name"
          name="name"
          minLength={2}
          onChange={(event) => setName(event.target.value)}
        ></input>
        <label htmlFor="username">Username</label>
        <input
          required
          id="username"
          name="username"
          minLength={2}
          onChange={(event) => setUsername(event.target.value)}
        ></input>
        <small>{usernameError}</small>
        <label htmlFor="password">Password</label>
        <input
          required
          id="password"
          name="password"
          minLength={6}
          onChange={(event) => {
            const newPassword = event.target.value;
            setPassword(newPassword);
            if (!validatePassword(newPassword)) {
              setPasswordError(
                "Password must have at least 6 characters, including one lowercase letter, one uppercase letter, and one number."
              );
            } else {
              setPasswordError("");
            }
          }}
        ></input>

        <small>{passwordError}</small>
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
