import { Schema, model } from "mongoose";

const ChatRoomSchema = new Schema({
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isGroupChat: {
    type: Boolean,
    default: false,
  },
  groupChatName: {
    type: String,
  },
  groupChatPicture: {
    type: String,
    default:
      "https://cdn6.aptoide.com/imgs/1/2/2/1221bc0bdd2354b42b293317ff2adbcf_icon.png",
  },
  createdAt: {
    type: Date,
  },
  lastUpdatedAt: {
    type: Date,
  },
});

const ChatRoomModel = model("ChatRoom", ChatRoomSchema);

export default ChatRoomModel;
