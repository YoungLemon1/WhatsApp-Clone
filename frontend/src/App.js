import React, { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/login";
import UserPage from "./components/user-page";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import enLocale from "date-fns/locale/en-GB"; // Use the appropriate locale

function App() {
  const [user, setUser] = useState(null);
  return (
    <LocalizationProvider dateAdapter={AdapterMoment} locale={enLocale}>
      {user ? (
        <UserPage user={user} setUser={setUser} />
      ) : (
        <Login setUser={setUser} />
      )}
    </LocalizationProvider>
  );
}

export default App;
