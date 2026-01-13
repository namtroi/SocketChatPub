import { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const ChatWindow: React.FC = () => {
    const { currentUser } = useAuth();
    const { currentConversation, messages, sendMessage, onlineUsers } = useChat();
    const { isConnected } = useSocket();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !isConnected) return;
        
        await sendMessage(inputValue);
        setInputValue('');
    };

    if (!currentConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-center p-8">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Pick a conversation
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Select a user from the sidebar to start chatting constantly.
                </p>
            </div>
        );
    }

    // Determine basic info about the chat partner (Assuming DM for now)
    const otherUserId = currentConversation.participants.find(p => p !== currentUser?.id);
    const isPartnerOnline = otherUserId ? onlineUsers.get(otherUserId) === 'ONLINE' : false;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black h-full">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
                <div className="flex items-center">
                   <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                           Chat {otherUserId ? `with ${otherUserId}` : ''} 
                           {/* Ideally map ID to Name here using a User Map if available globally */}
                        </h3>
                        {otherUserId && (
                            <p className="text-xs text-green-500 font-medium flex items-center">
                                {isPartnerOnline ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                        Online
                                    </>
                                ) : (
                                    <span className="text-gray-400">Offline</span>
                                )}
                            </p>
                        )}
                   </div>
                </div>
                <div className="flex items-center space-x-4">
                     {/* Placeholder for future actions */}
                     <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                     </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <p>No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <div 
                                key={msg._id || index} 
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-zinc-700'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-gray-100 dark:bg-black border-none rounded-full py-3.5 pl-6 pr-14 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                    />
                    <button 
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md transform active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
