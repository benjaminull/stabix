'use client';

import { useState, useRef, useEffect } from 'react';
import { useMessages, useSendMessage } from '@/lib/api/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/format';

interface ChatPanelProps {
  orderId: number;
}

export function ChatPanel({ orderId }: ChatPanelProps) {
  const { data: messages, isLoading } = useMessages(orderId);
  const sendMessage = useSendMessage(orderId);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messageList = Array.isArray(messages) ? messages : (messages as any)?.results || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await sendMessage.mutateAsync({ text: text.trim() });
      setText('');
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Cargando mensajes...</p>
        ) : messageList.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No hay mensajes aún. Inicia la conversación.
          </p>
        ) : (
          messageList.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender_type === 'customer'
                    ? 'bg-accent-500 text-white'
                    : 'bg-muted'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.sender_type === 'customer' ? 'text-white/60' : 'text-muted-foreground'
                }`}>
                  {formatRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1"
          disabled={sendMessage.isPending}
        />
        <Button type="submit" size="sm" disabled={sendMessage.isPending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
