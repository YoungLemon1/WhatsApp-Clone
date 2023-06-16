import { Schema, model } from "mongoose";

const ContactSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  contactName: {
    type: String,
    required: true,
  },
});

const ContactModel = model("Contact", ContactSchema);
export default ContactModel;
