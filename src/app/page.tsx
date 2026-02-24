"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MapPin, Wind, Thermometer, Cloud, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    city: string;
    weatherData: string;
  };
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Weather Data Agent. Try asking me about the weather in any city, like 'What is the weather in Tokyo?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract weather details from the raw string
  const renderWeatherWidget = (metadata: NonNullable<Message["metadata"]>) => {
    try {
      if (!metadata.weatherData || metadata.weatherData === "Error fetching data.") return null;

      const parsedData = JSON.parse(metadata.weatherData);

      return (
        <div className="mt-4 p-4 rounded-xl bg-surface-2 backdrop-blur-md border border-border text-foreground w-full max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="text-accent-teal h-5 w-5" />
            <h3 className="font-semibold text-sm line-clamp-1" title={parsedData.location}>
              {parsedData.location}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col bg-input p-3 rounded-lg border border-border items-center justify-center">
              <Thermometer className="h-5 w-5 text-accent-orange mb-1" />
              <div className="font-bold text-lg">{parsedData.temp}</div>
              <div className="text-xs text-foreground/50">Temperature</div>
            </div>
            <div className="flex flex-col bg-input p-3 rounded-lg border border-border items-center justify-center">
              <Wind className="h-5 w-5 text-accent-blue mb-1" />
              <div className="font-bold text-lg">{parsedData.wind}</div>
              <div className="text-xs text-foreground/50">Wind Speed</div>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">

      {/* Header */}
      <header className="flex-shrink-0 bg-surface-1/90 backdrop-blur-md border-b border-border p-4 sticky top-0 z-10 flex items-center justify-center gap-3">
        <div className="p-2 rounded-full bg-accent-blue/20 text-accent-blue">
          <Cloud className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-accent-yellow">
          Weather Data Agent
        </h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`flex flex-col max-w-[85%] sm:max-w-[75%] rounded-2xl ${message.role === "user"
                ? "bg-accent-blue text-[#0B0B0F] rounded-tr-sm"
                : "bg-surface-1 text-foreground border border-border rounded-tl-sm"
                }`}
            >
              <div className="p-4 leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>

              {message.metadata && (
                <div className="px-4 pb-4">
                  {renderWeatherWidget(message.metadata)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-1 border border-border p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-accent-blue animate-spin" />
              <span className="text-sm text-foreground/50 hidden sm:inline">Checking global sensors...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 bg-surface-1/90 backdrop-blur-md border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the weather in any city..."
              disabled={isLoading}
              className="flex-1 bg-input text-foreground border border-border rounded-full px-6 py-4 outline-none focus:ring-1 focus:ring-accent-teal focus:border-accent-teal transition-all shadow-inner disabled:opacity-50 placeholder-foreground/40"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-accent-yellow hover:bg-accent-yellow-hover text-[#0B0B0F] rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-accent-yellow focus:outline-none focus:ring-2 focus:ring-accent-yellow/50"
            >
              <Send className="h-5 w-5 ml-1" />
            </button>
          </form>
          <div className="text-center mt-3 text-xs text-foreground/40">
            Powered by Gemini and Open-Meteo
          </div>
        </div>
      </footer>
    </div>
  );
}
