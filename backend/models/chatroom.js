import { Schema, model } from "mongoose";

const ChatRoomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const ChatRoomModel = model("ChatRoom", ChatRoomSchema);

export default ChatRoomModel;
