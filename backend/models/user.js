import { Schema, model } from "mongoose";
const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    birthdate: {
      type: Date,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    imageURL: {
      type: String,
      default: process.env.DEFAULT_USER_IMG_URL,
    },
    friendList: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const User = model("User", UserSchema);
export default User;
