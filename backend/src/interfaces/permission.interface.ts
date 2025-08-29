import mongoose from "mongoose";

export interface Ipermission extends Document {
    permissionKey: string,
    description?: string
}