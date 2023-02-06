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
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const OrganisationInvite = model("OrganisationInvite", schema, "organisationInvites");
