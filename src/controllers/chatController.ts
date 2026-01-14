import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { pubSubService } from '../services/PubSubService';


export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { group_name, user_list } = req.body;

    if (!group_name || !user_list || !Array.isArray(user_list) || user_list.length < 2) {
      res.status(400).json({ error: 'Invalid input. group_name and user_list (min 2) are required.' });
      return;
    }

    // Generate unique ID for group (schema expects String _id)
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newGroup = new Conversation({
      _id: groupId,
      conversation_type: 'GROUP',
      conversation_name: group_name,
      participants: user_list,
    });

    const savedGroup = await newGroup.save();

    res.status(201).json({ conversation_id: savedGroup._id });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_id, content } = req.body;
    const sender_id = (req.headers['x-user-id'] as string) || 'u1'; // Default to u1 if missing for now

    if (!conversation_id || !content) {
      res.status(400).json({ error: 'Invalid input. conversation_id and content are required.' });
      return;
    }

    // Verify conversation exists or create for DM
    // Use findOne to handle both ObjectId and custom string IDs (like dm_xxx)
    let conversation = await Conversation.findOne({ _id: conversation_id });
    
    // Feature: Auto-create DM conversation if ID follows 'dm_' pattern and doesn't exist
    if (!conversation && conversation_id.startsWith('dm_')) {
         const participants = conversation_id.replace('dm_', '').split('_');
         
         // Create new Direct Message Conversation on the fly
         if (participants.length === 2) {
             const newConv = new Conversation({
                 _id: conversation_id,
                 conversation_type: 'DIRECT',
                 participants: participants
             });
             conversation = await newConv.save();
         } else {
             res.status(400).json({ error: 'Invalid DM ID format.' });
             return;
         }
    } else if (!conversation) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    const newMessage = new Message({
      conversation_id,
      sender_id,
      content,
    });

    const savedMessage = await newMessage.save();

    await pubSubService.publish('chat:message', {
        type: 'NEW_MESSAGE',
        payload: {
            conversation_id: savedMessage.conversation_id,
            message_id: savedMessage._id,
            sender_id: savedMessage.sender_id,
            content: savedMessage.content,
            created_at: savedMessage.createdAt,
            participants: conversation.participants, // For targeted broadcast
        }
    });

    res.status(200).json({
      message_id: savedMessage._id,
      timestamp: savedMessage.createdAt,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const cursor = req.query.cursor as string;

    if (!conversation_id) {
      res.status(400).json({ error: 'Invalid input. conversation_id is required.' });
      return;
    }

    // Build query
    const query: any = { conversation_id };
    if (cursor) {
      query._id = { $lt: cursor }; // Pagination: fetching older messages
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 }) // Sort by newest first
      .limit(limit);

    const next_cursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      history: messages,
      next_cursor,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get all GROUP conversations where user is a participant
 * GET /chat/groups?user_id=xxx
 */
export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.query.user_id as string || req.headers['x-user-id'] as string;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    const groups = await Conversation.find({
      conversation_type: 'GROUP',
      participants: user_id
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
