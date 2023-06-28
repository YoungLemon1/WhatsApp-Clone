import React, { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";
import moment from "moment";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

function App() {
  const [user, setUser] = useState(null);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} dateLibrary={moment}>
      {user ? (
        <UserPage user={user} setUser={setUser} />
      ) : (
        <Login setUser={setUser} />
      )}
    </LocalizationProvider>
  );
}

export default App;
