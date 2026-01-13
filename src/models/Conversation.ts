import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation {
  conversation_type: 'GROUP' | 'DIRECT';
  conversation_name?: string;
  participants: string[]; // User IDs (e.g., 'u1', 'u2')
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    conversation_type: {
      type: String,
      enum: ['GROUP', 'DIRECT'],
      required: true,
    },
    conversation_name: { type: String },
    participants: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

