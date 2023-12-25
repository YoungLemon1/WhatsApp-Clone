import { Schema, model } from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();
const DEFAULT_IMAGE_URL = process.env.DEFAULT_USER_IMG_URL;
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
    role: {
      type: String,
    },
    imageURL: {
      type: String,
      default: DEFAULT_IMAGE_URL,
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
