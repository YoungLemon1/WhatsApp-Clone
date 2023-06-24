import { Schema, model } from "mongoose";

const GroupMessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupChat: {
    type: Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const GroupMessage = model("GroupMessage", GroupMessageSchema);

export default GroupMessage;
