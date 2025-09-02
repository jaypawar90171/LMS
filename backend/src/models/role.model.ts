import mongoose, { Schema, Document } from "mongoose";
import { Irole } from "../interfaces/role.interface";

const rolesSchema = new mongoose.Schema<Irole>(
  {
    roleName: {
      type: String,
      require: true,
      required: true,
      trim: true,
      default: "Employee",
    },
    description: {
      type: String,
      trim: true,
      maxLength: 300,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    immutable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent deletion of immutable roles
rolesSchema.pre("findOneAndDelete", async function (next) {
  const doc: any = await this.model.findOne(this.getFilter());
  if (doc?.immutable) {
    const err = new Error("This role is immutable and cannot be deleted.");
    return next(err);
  }
  next();
});

// Prevent updates of immutable roles
rolesSchema.pre("findOneAndUpdate", async function (next) {
  const doc: any = await this.model.findOne(this.getFilter());
  if (doc?.immutable) {
    const err = new Error("This role is immutable and cannot be updated.");
    return next(err);
  }
  next();
});

const Role = mongoose.model<Irole>("Role", rolesSchema);
export default Role;
