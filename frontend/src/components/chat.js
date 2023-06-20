import React, { useState } from "react";
import { useParams } from "react-router-dom";

function Chat() {
  const { id } = useParams();
  const [loggedUser, SetLoggedUser] = useState("");
  <div>
    <h1>Chat Room: {id}</h1>
    {/* Rest of the component */}
  </div>;
}
export default Chat;
