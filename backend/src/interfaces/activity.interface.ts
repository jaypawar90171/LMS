import { Document, Types } from "mongoose";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  actor: {
    userId: Types.ObjectId;   
    name?: string;            
    role?: string;            
  };
  actionType: string;          
  target: {
    userId: Types.ObjectId;  
    name?: string;                   
    role?: string;             
  };
  // what action performed
  description?: string;
  metadata?: Record<string, any>; 
}
