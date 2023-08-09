import { Schema, model } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    chatroom: {
      type: Schema.Types.ObjectId,
      ref: "Chatroom",
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = model("Message", MessageSchema);

export default Message;
