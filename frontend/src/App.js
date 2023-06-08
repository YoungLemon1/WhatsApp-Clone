import "./App.css";
import { useEffect, useState } from "react";
import Axios from "axios";

import "react-datepicker/dist/react-datepicker.css";
import AllUsers from "./components/AllUsers";
import NewUser from "./components/NewUser";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Axios.get("http://localhost:5000/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  const addUser = (user) => {
    setUsers([...users, user]);
  };

  return (
    <div className="App">
      <AllUsers users={users}></AllUsers>
      <NewUser users={users} addUser={addUser} />
    </div>
  );
}

export default App;
