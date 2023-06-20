import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
  },
  recipient: {
    type: Schema.Types.ObjectId,
  },
  text: {
    type: String,
  },
  CreatedAt: {
    type: Date,
  },
  isGroup: {
    type: Boolean,
  },
});

const MessageModel = model("Message", MessageSchema);

export default MessageModel;
