import { Schema, model } from "mongoose";

const ChatroomSchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    activeMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
      default: process.env.DEFAULT_GROUP_IMG_URL,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

ChatroomSchema.index({ members: 1, title: 1, isPrivate: -1 });

const Chatroom = model("ChatRoom", ChatroomSchema);

export default Chatroom;
