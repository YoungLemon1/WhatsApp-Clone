import { Schema, model } from "mongoose";
import customValidator from "./validator/customValidator";

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
  validate: {
    validator: customValidator,
    messages: {
      "No sender error": "Message must include sender id",
      "No recipient error":
        "At least one of recipient id or chatroom id is required",
      "Conflicting message type error":
        "Both sender_id and chatroom_id cannot be set",
      "Empty message error": "Empty messages cannot be sent",
    },
  },
});

const Message = model("Message", MessageSchema);

export default Message;
