import React, { useState } from "react";
import "./App.css";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";
import { Button } from "react-bootstrap";
import { id } from "date-fns/locale";

function App() {
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const socket = io.connect("http://localhost:5000");
  return (
    <div className="App">
      {!loggedIn ? (
        <Login
          socket={socket}
          username={username}
          setUsername={setUsername}
          setId={setId}
        />
      ) : (
        <UserPage loggedUser={id} />
      )}
    </div>
  );
}

export default App;
