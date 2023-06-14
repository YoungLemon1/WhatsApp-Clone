import { Schema, model } from "mongoose";
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
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
  },
  role: {
    type: String,
    required: true,
  },
});

const UserModel = model("users", UserSchema);
export default UserModel;
