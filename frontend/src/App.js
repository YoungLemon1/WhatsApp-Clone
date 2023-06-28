import React, { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";

function App() {
  const [user, setUser] = useState(null);

  if (user) {
    return <UserPage user={user} setUser={setUser} />;
  } else {
    return <Login setUser={setUser} />;
  }
}

export default App;
