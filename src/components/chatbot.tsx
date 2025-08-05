
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { chat } from '@/ai/flows/chatbot-flow';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setMessages([
            { text: "Hello! I'm the ClassHub assistant. How can I help you navigate the site today?", sender: 'bot' }
        ]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await chat(input);
      const botMessage: Message = { text: botResponse, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-14 h-14 shadow-lg">
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-full max-w-sm shadow-2xl flex flex-col h-[60vh]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-headline">
              <Bot /> ClassHub Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
             <ScrollArea className="h-full px-6 py-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
                    >
                    {message.sender === 'bot' && <AvatarIcon><Bot className="h-5 w-5"/></AvatarIcon>}
                    <div
                        className={`rounded-lg px-3 py-2 max-w-xs text-sm ${
                        message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                    >
                        {message.text}
                    </div>
                    {message.sender === 'user' && <AvatarIcon><User className="h-5 w-5"/></AvatarIcon>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <AvatarIcon><Bot className="h-5 w-5"/></AvatarIcon>
                        <div className="rounded-lg px-3 py-2 bg-muted text-sm">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

const AvatarIcon = ({children}: {children: React.ReactNode}) => (
    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
        {children}
    </div>
)
