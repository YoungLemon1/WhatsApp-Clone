import { Schema, model } from "mongoose";
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  birthdate: {
    type: Date,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  imageURL: {
    type: String,
    required: false,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  },
  conatcts: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  role: {
    type: String,
    required: true,
  },
});

const User = model("User", UserSchema);
export default User;
