"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      });

      const data = (await response.json()) as { response?: string };

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content:
          data.response ??
          "Não consegui responder agora. Tente novamente em alguns instantes.",
        timestamp: new Date(),
      };

      setMessages((currentMessages) => [...currentMessages, agentMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-amber-600 p-4 text-white shadow-lg transition hover:bg-amber-700"
        aria-label="Abrir assistente IA"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 flex h-96 w-96 flex-col rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-amber-600 p-4 text-white">
            <h3 className="font-bold">Assistente IA</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar assistente IA"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="mt-8 text-center text-slate-500">
                <p className="mb-2 font-semibold">Olá! 👋</p>
                <p className="text-sm">
                  Sou seu assistente de IA. Como posso ajudar?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.type === "user"
                      ? "bg-amber-100 text-slate-900"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-4 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 border-t p-4">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-amber-600 p-2 text-white hover:bg-amber-700 disabled:opacity-50"
              aria-label="Enviar mensagem"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
