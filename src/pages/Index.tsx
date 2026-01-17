import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/my/chat/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.output || data.message || "No response received",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">TruChat</h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/ingest")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Ingest
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Welcome to TruChat</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                  <div className="flex space-x-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form
          onSubmit={handleSendMessage}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Index;
