'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {MessageSquare, Send, Bot, User, CornerDownLeft} from 'lucide-react';
import {chat} from '@/ai/flows/chat-flow';
import {ScrollArea} from './ui/scroll-area';

type ChatMessage = {
  role: 'user' | 'model';
  prompt: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessages: ChatMessage[] = [...messages, {role: 'user', prompt: input}];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chat({
        history: newMessages.slice(0, -1),
        prompt: input,
      });
      setMessages([...newMessages, {role: 'model', prompt: response}]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {role: 'model', prompt: 'Sorry, I had trouble responding.'},
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        // Use `setTimeout` to allow the DOM to update before scrolling
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 0);
    }
  }, [messages]);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={32} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot />
              ClassHub Assistant
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow p-4 border-y" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'model' && (
                    <div className="bg-primary rounded-full p-2">
                      <Bot className="text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-secondary'
                        : 'bg-card'
                    }`}
                  >
                    <p className="text-sm">{message.prompt}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="bg-secondary rounded-full p-2">
                      <User />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="bg-primary rounded-full p-2 animate-pulse">
                    <Bot className="text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-card">
                    <p className="text-sm italic">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4">
            <div className="relative">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Ask me anything..."
                className="pr-10"
                disabled={loading}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? <CornerDownLeft className="animate-ping"/> : <Send />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
