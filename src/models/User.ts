import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  picture?: string;
  googleId?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: false,
    },
    picture: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries
UserSchema.index({ email: 1, googleId: 1 });

export default mongoose.model<IUser>("User", UserSchema);
