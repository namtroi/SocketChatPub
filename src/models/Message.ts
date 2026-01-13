import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  conversation_id: string; // Changed from ObjectId to String to support custom IDs
  sender_id: string; 
  content: string;
  createdAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation_id: { type: String, ref: 'Conversation', required: true },
    sender_id: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Only createdAt is usually needed for messages
);

export default mongoose.model<IMessage>('Message', MessageSchema);
