import ReactMarkdown from "react-markdown";
import "./MessageBubble.css";

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ role, content, isError, timestamp }) {
  const isUser = role === "user";

  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : "bubble-row--assistant"}`}>
      <div
        className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"} ${isError ? "bubble--error" : ""}`}
      >
        <div className="bubble__text">
          {isUser ? content : <ReactMarkdown>{content}</ReactMarkdown>}
        </div>
        <span className="bubble__time">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

