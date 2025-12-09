const mongoose = require("mongoose");
const { Schema } = mongoose;


const queueMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    notificationExpires: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "notified", "skipped", "issued"],
    },
  },
  { _id: false } // prevents auto-generating _id for subdocument
);

const queueSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      unique: true,
    },
    queueMembers: [queueMemberSchema],
    currentNotifiedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Reference to the specific ItemCopy that was reserved for this user during the 'Ready' status.
    assignedCopyId: {
        type: Schema.Types.ObjectId,
        ref: "ItemCopy",
        default: null,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

queueSchema.index({ itemId: 1 });
queueSchema.index({ "queueMembers.status": 1 });
queueSchema.index({ "queueMembers.notificationExpires": 1 });

const Queue = mongoose.model("Queue", queueSchema);
module.exports = Queue;
