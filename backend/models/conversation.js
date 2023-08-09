import { Schema, model } from "mongoose";

const ConversationSchema = new Schema(
  {
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now(),
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

const Conversation = model("Conversation", ConversationSchema);

export default Conversation;
