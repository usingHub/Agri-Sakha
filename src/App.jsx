import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./components/ChatMessage";
import { FaMicrophone } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

const LANGUAGES = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

function App() {
  const [messages, setMessages] = useState([]); // Initially empty, no assistant message here
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US";

      recognition.current.onstart = () => {
        setIsListening(true);
      };

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputRef.current.value = transcript;
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, [language]);

  useEffect(() => {
    // Some browsers (like Chrome) need this to load all available voices properly
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices(); // triggers loading
    };
  }, []);

  const speak = (text) => {
    const synth = window.speechSynthesis;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    let selectedLang = "en-US"; // Default language

    if (language === "hi") {
      selectedLang = "hi-IN";
    } else if (language === "gu") {
      selectedLang = "gu-IN"; // Try Gujarati first
    }

    const voices = synth.getVoices();
    let voice = voices.find(v => v.lang === selectedLang);

    // Fallback logic if the selected voice is unavailable
    if (!voice && language === "gu") {
      voice = voices.find(v => v.lang === "hi-IN"); // Fallback to Hindi if Gujarati not available
      selectedLang = "hi-IN";
      console.warn("Gujarati voice not found, using Hindi voice as fallback.");
    }

    if (!voice) {
      voice = voices.find(v => v.lang === "en-US");
      selectedLang = "en-US";
      console.warn("No voice found for selected language, using English.");
    }

    utterance.voice = voice;
    utterance.lang = selectedLang;

    // Start speaking the new message
    synth.speak(utterance);
  };

  const stripHTML = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    let text = div.textContent || div.innerText || "";
    text = text.replace(/[*_`~]/g, "");
    return text.trim();
  };

  const addMessage = (text, isUser = true) => {
    const cleanText = stripHTML(text);
    setMessages((prev) => [...prev, { text: cleanText, isUser }]);
    if (!isUser) speak(cleanText);
  };

  const handleSend = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;

    // Add the user's message to the conversation
    addMessage(text, true);
    inputRef.current.value = "";
    setLoading(true);

    try {
      const response = await fetch("https://agri-sakha-server.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: `Reply in ${LANGUAGES[language]}: ${text}`,
        }),
      });

      const data = await response.json();
      if (data?.reply) {
        addMessage(data.reply, false); // Add assistant's reply
      } else {
        addMessage("Sorry, I couldn't get a valid response.", false);
      }
    } catch (err) {
      console.error("Error talking to backend:", err);
      addMessage("Error connecting to the AI.", false);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechButtonClick = () => {
    if (recognition.current && !isListening) {
      recognition.current.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US";
      recognition.current.start();
    } else if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  return (
    
    <div className="min-h-screen bg-white flex flex-col font-sans text-black text-xl" > {/* Added text-xl here */}
      
      <header className="bg-green-800 text-white p-4 shadow-md">
      
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">🌱 Agri-Sakha</h1>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-black bg-white p-2 rounded"
          >
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 container mx-auto space-y-6">
        {(() => {
          const groupedMessages = [];
          for (let i = 0; i < messages.length; i++) {
            const current = messages[i];
            const next = messages[i + 1];

            if (current.isUser && next && !next.isUser) {
              groupedMessages.push(
                <div key={i} className="space-y-2 mb-6">
                  <ChatMessage message={current.text} isUser />
                  <ChatMessage message={next.text} isUser={false} />
                </div>
              );
              i++; // skip next, since it's already included
            } else {
              groupedMessages.push(
                <div key={i} className="mb-6">
                  <ChatMessage message={current.text} isUser={current.isUser} />
                </div>
              );
            }
          }
          return groupedMessages;
        })()}
        <div ref={chatContainerRef} />
      </main>


      <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
        <div className="flex justify-center">
          <div className="flex flex-col items-center w-full max-w-2xl gap-2">
            {/* Input row */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleSpeechButtonClick}
                className={`p-3 rounded-full bg-black text-white hover:bg-gray-800 focus:outline-none ${isListening ? 'bg-red-500' : ''}`}
              >
                <FaMicrophone size={20} />
              </button>

              <input
                type="text"
                ref={inputRef}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />

              <button
                onClick={handleSend}
                className="bg-black text-white p-3 rounded-full hover:bg-gray-800 focus:outline-none disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "..." : <IoSend size={20} />}
              </button>
            </div>

            {/* Loading Message */}
            {loading && (
              <div className="text-sm text-gray-500 italic">Thinking...</div>
            )}
          </div>
        </div>
      </footer>
      

    </div>
  );
}

export default App;