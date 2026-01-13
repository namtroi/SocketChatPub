import mongoose, { Schema, Document } from 'mongoose';

export interface IUser {
  _id: string; // Custom string ID (e.g., 'u1')
  username: string;
  isOnline: boolean;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  isOnline: { type: Boolean, default: false },
});

export default mongoose.model<IUser>('User', UserSchema);


