import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  conversation_id: mongoose.Types.ObjectId;
  sender_id: string; // custom ID like 'u1'
  content: string;
  createdAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Only createdAt is usually needed for messages
);

export default mongoose.model<IMessage>('Message', MessageSchema);
