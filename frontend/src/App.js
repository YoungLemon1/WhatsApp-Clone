import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";
import Signup from "./components/signup";

function App() {
  const [user, setUser] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  //const socket = io.connect("http://localhost:5000");
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !loggedIn ? (
                <Login setUser={setUser} setLoggedIn={setLoggedIn} />
              ) : (
                <UserPage user={user} />
              )
            }
          />
          <Route path="/signup" element={<Signup></Signup>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
