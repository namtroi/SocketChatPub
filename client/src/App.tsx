import { useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-black overflow-hidden flex flex-col">
      {!currentUser ? (
        <LoginModal />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <ChatWindow />
        </div>
      )}
    </div>
  );
}

export default App;
