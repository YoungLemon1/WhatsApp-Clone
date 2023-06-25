const customValidator = (message) => {
  if (message.sender === null) {
    throw new Error("No sender error");
  } else if (message.recipient === null && message.chatroom === null) {
    throw new Error("No recipient error");
  } else if (message.sender !== null && message.chatroom !== null) {
    throw new Error("Conflicting message type error");
  } else if (message.message === null || message.message === "") {
    throw new Error("Empty message error");
  }
};

export default customValidator;
