import mongoose, { Schema } from "mongoose";
import { IDonation } from "../interfaces/donation.interface";

const donationSchema = new Schema<IDonation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    photos: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
    donationType: {
      type: String,
      enum: ["giveaway", "duration"],
      default: "giveaway",
    },
    preferredContactMethod: {
      type: String,
      enum: ["Email", "whatsApp"],
      default: "whatsApp",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Donation = mongoose.model<IDonation>("Donation", donationSchema);
export default Donation;
