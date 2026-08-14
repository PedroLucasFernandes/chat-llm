import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "./ChatWindow.css";

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      {messages.length === 0 && !isLoading && (
        <div className="chat-window__empty">
          <div className="chat-window__empty-icon">💬</div>
          <p className="chat-window__empty-title">Olá! Como posso ajudar?</p>
          <p className="chat-window__empty-subtitle">
            Envie uma mensagem para começar a conversa.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          isError={msg.isError}
          timestamp={msg.timestamp}
        />
      ))}

      {isLoading && (
        <div className="bubble-row bubble-row--assistant">
          <div className="bubble bubble--assistant typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
