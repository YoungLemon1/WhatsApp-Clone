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
      index: 1,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, chatroom: 1 });

MessageSchema.methods.isGroupChat = function () {
  return this.chatroom && true;
  //return this.chatReference.kind === 'Chatroom';
};

const Message = model("Message", MessageSchema);

export default Message;
