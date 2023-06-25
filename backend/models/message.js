import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  chatroom: {
    type: Schema.Types.ObjectId,
    ref: "Chatroom",
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  validate: function (message) {
    if (message.sender === null && message.chatroom === null) {
      throw new Error("At least one of sender_id or chatroom_id is required");
    } else if (message.sender !== null && message.chatroom !== null) {
      throw new Error("Both sender_id and chatroom_id cannot be set");
    }
  },
});

const Message = model("Message", MessageSchema);

export default Message;
