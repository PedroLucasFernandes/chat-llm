import { useState, useCallback } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import { sendChat } from "./services/api";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleSend = useCallback(
    async (text) => {
      const userMsg = {
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const data = await sendChat(text, sessionId);
        setSessionId(data.session_id);

        const assistantMsg = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg = {
          role: "assistant",
          content: err.message,
          isError: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <div className="app__logo">✦</div>
          <div>
            <h1 className="app__title">Chat LLM</h1>
            <p className="app__subtitle">Assistente inteligente</p>
          </div>
        </div>
      </header>

      <main className="app__main">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <InputBar onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
