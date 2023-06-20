import { Schema, model } from "mongoose";

const ChatRoomSchema = new Schema({
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isGroupchat: {
    type: Boolean,
    default: false,
  },
  groupChatName: {
    type: String,
  },
  groupChatPicture: {
    type: String,
  },
  CreatedAt: {
    type: Date,
  },
  LastUpdatedAt: {
    type: Date,
  },
  LastMessage: {
    type: Schema.Types.ObjectId,
    ref: "Message",
  },
});

const ChatRoomModel = model("ChatRoom", ChatRoomSchema);

export default ChatRoomModel;
