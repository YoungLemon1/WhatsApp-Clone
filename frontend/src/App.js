import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";
import Signup from "./components/signup";
import Chat from "./components/chat";

function App() {
  const [user, setUser] = useState(null);

  const homeRoute = () => {
    return user ? (
      <UserPage user={user} setUser={setUser} />
    ) : (
      <Login setUser={setUser} />
    );
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={homeRoute()} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
