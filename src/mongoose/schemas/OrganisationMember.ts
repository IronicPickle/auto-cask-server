import { model, Schema } from "mongoose";

const schema = new Schema({
  organisation: {
    type: Schema.Types.ObjectId,
    ref: "Organisation",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    default: "MEMBER",
    required: true,
  },
  joinedOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const OrganisationMember = model("OrganisationMember", schema, "organisationMember");
