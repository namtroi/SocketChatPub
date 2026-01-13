import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { ChatProvider, useChat } from './contexts/ChatContext';

function TestControls() {
  const { currentUser, login, logout, availableUsers } = useAuth();
  const { isConnected } = useSocket();
  useChat();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Auth Status</h2>
        <p>Current User: {currentUser ? currentUser.name : 'None'}</p>
        <div className="flex gap-2 mt-2">
          {availableUsers.map(u => (
            <button 
              key={u.id}
              onClick={() => login(u.id)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login {u.name}
            </button>
          ))}
          <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Socket Status</h2>
        <p>Connected: <span className={isConnected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {isConnected ? 'YES' : 'NO'}
        </span></p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <TestControls />
          </div>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
