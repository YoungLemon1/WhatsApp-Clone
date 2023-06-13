import React, { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";

function App() {
  const [user, setUser] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  //const socket = io.connect("http://localhost:5000");
  return (
    <div className="App">
      {!loggedIn ? (
        <Login setUser={setUser} setLoggedIn={setLoggedIn} />
      ) : (
        <UserPage user={user} />
      )}
    </div>
  );
}

export default App;
