import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Navbar, Container } from "react-bootstrap";
import { useEffect, useState } from "react";
import Axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import AllUsers from "./components/AllUsers";
import NewUser from "./components/NewUser";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {}, []);

  const addUser = (user) => {
    setUsers([...users, user]);
  };

  return (
    <Container className="App">
      <Container id="login">
        <h1>Chat and Play</h1>
        <Container>
          <label id="username">Username</label>
          <input id="username" name="username"></input>
        </Container>
        <Container>
          <label id="password">Password</label>
          <input id="password" name="password" disabled></input>
        </Container>
        <Button id="login" name="login" variant="success">
          login
        </Button>
      </Container>
    </Container>
  );
}

export default App;
