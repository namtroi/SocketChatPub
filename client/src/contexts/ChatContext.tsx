import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import type { Conversation, Message, WSEvent, NewMessagePayload, PresenceUpdatePayload } from '../types';
import { API_BASE } from '../config';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  onlineUsers: Map<string, string>; // userId -> status
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
  createGroup: (name: string, members: string[]) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  
  const [conversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        
        switch (data.type) {
          case 'NEW_MESSAGE': {
            const msgPayload = data.payload as NewMessagePayload;
            // Only append if it belongs to the current conversation
            if (currentConversation && currentConversation._id === msgPayload.conversation_id) {
                setMessages((prev) => [...prev, {
                    _id: msgPayload.message_id,
                    conversation_id: msgPayload.conversation_id,
                    sender_id: msgPayload.sender_id,
                    content: msgPayload.content,
                    created_at: msgPayload.created_at
                }]);
            }
            break;
          }

          case 'PRESENCE_UPDATE': {
            const presencePayload = data.payload as PresenceUpdatePayload;
            setOnlineUsers((prev) => {
              const newMap = new Map(prev);
              newMap.set(presencePayload.user_id, presencePayload.status);
              return newMap;
            });
            break;
          }
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WS message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, currentConversation]);

  // Fetch History when Current Conversation Changes
  useEffect(() => {
    if (!currentConversation) {
        setTimeout(() => setMessages([]), 0);
        return;
    }

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/chat/history?conversation_id=${currentConversation._id}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.history);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    fetchHistory();
  }, [currentConversation]);

  const sendMessage = async (content: string) => {
    if (!currentConversation || !currentUser) return;
    
    try {
        await fetch(`${API_BASE}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation_id: currentConversation._id,
                content
            })
        });
    } catch (err) {
        console.error('Failed to send message', err);
    }
  };

  const createGroup = async (name: string, members: string[]) => {
      try {
          const res = await fetch(`${API_BASE}/chat/group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: name,
                user_list: members
            })
          });
          await res.json();
          // Ideally we re-fetch conversations here or get the full object back
      } catch (err) {
          console.error('Failed to create group', err);
      }
  };

  return (
    <ChatContext.Provider value={{ 
        conversations, 
        currentConversation, 
        messages, 
        onlineUsers, 
        setCurrentConversation, 
        sendMessage,
        createGroup 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
