import { Schema, model } from "mongoose";

const ConversationSchema = new Schema({
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
});

const Conversation = model("Conversation", ConversationSchema);

export default Conversation;
