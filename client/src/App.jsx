import ChatHeader from "./components/ChatHeader.jsx";
import Composer from "./components/Composer.jsx";
import MessageList from "./components/MessageList.jsx";
import { useChat } from "./hooks/useChat.js";

/** Compose the chat interface from its header, message list, and composer. */
export default function App() {
  const chat = useChat();

  return (
    <div className="shell">
      <ChatHeader onNewChat={chat.newChat} />
      <MessageList
        messages={chat.messages}
        busy={chat.busy}
        onStarterSelect={chat.send}
        onRetry={() => chat.send(chat.lastUserMessage, true)}
        retryDisabled={chat.busy || !chat.lastUserMessage}
      />
      <Composer
        input={chat.input}
        busy={chat.busy}
        onInputChange={chat.setInput}
        onSend={chat.send}
      />
    </div>
  );
}
