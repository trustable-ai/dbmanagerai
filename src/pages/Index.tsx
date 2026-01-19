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

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string): JSX.Element => {
  // Process code blocks first (```code```)
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add code block
    const code = match[2];
    parts.push(
      <pre key={match.index} className="bg-muted/50 rounded p-3 my-2 overflow-x-auto">
        <code className="text-sm">{code}</code>
      </pre>
    );
    lastIndex = match.index + match[0].length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // Process inline elements for text parts
  const processInline = (str: string, key: number): JSX.Element => {
    // Process inline code (`code`)
    let processed = str.split(/`([^`]+)`/).map((part, i) =>
      i % 2 === 1 ? <code key={i} className="bg-muted/50 px-1 rounded text-sm">{part}</code> : part
    );

    // Process bold (**text**)
    processed = processed.flatMap((part, i) => {
      if (typeof part !== "string") return part;
      return part.split(/\*\*([^*]+)\*\*/).map((p, j) =>
        j % 2 === 1 ? <strong key={`${i}-${j}`}>{p}</strong> : p
      );
    });

    // Process italic (*text* or _text_)
    processed = processed.flatMap((part, i) => {
      if (typeof part !== "string") return part;
      return part.split(/(?<!\*)\*([^*]+)\*(?!\*)/).map((p, j) =>
        j % 2 === 1 ? <em key={`${i}-${j}-em`}>{p}</em> : p
      );
    });

    return <span key={key}>{processed}</span>;
  };

  return (
    <div className="space-y-1">
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <div key={i}>
            {part.split("\n").map((line, j) => (
              <div key={j}>{processInline(line, j) || <br />}</div>
            ))}
          </div>
        ) : (
          part
        )
      )}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userInput = inputValue.trim();
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: userInput,
    };

    // Build conversation history from existing messages (before adding current user message)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create placeholder for assistant message
    const assistantId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    // Create abort controller for stopping the stream
    abortControllerRef.current = new AbortController();

    try {
      const streamUrl = import.meta.env.VITE_STREAM || "";
      const endpoint = streamUrl ? `${streamUrl}/web/truchat/v1/chat` : "/api/my/v1/chat";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: userInput,
          messages: history
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse streaming JSON - each chunk is a JSON string like "Hello"
        // Split by newlines and parse each line
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            // The parsed result is just the string content
            if (typeof parsed === 'string') {
              accumulated += parsed;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // If no streaming content received, try to parse as regular JSON response
      if (!accumulated) {
        const text = decoder.decode();
        try {
          const data = JSON.parse(text);
          accumulated = data.output || data.message || "No response received";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        } catch {
          // Keep empty if nothing parsed
        }
      }
    } catch (error) {
      // Don't show error toast if user aborted the request
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted by user, keep the partial response
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to send message"
        );
        // Remove empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.content !== ""));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
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
                  {message.role === "assistant" ? (
                    renderMarkdown(message.content)
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
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
        <div className="mx-auto max-w-3xl space-y-2">
          {isLoading && (
            <div className="flex justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopGeneration}
              >
                Stop
              </Button>
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2"
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
    </div>
  );
};

export default Index;
