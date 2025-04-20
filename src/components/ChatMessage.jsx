export default function ChatMessage({ message, isUser }) {
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} my-4`}>
      <div
        className={`
          max-w-[75%]
          px-5 py-4
          rounded-2xl
          text-sm
          whitespace-pre-wrap
          break-words
          shadow-md
          font-medium
          border
          ${isUser
            ? "bg-green-100 text-black border-green-300 rounded-br-none"
            : "bg-yellow-100 text-black border-yellow-300 rounded-bl-none"}
        `}
      >
        {message}
      </div>
    </div>
  );
}
