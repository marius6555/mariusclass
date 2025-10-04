
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chat } from '@/ai/flows/chat';
import type { ChatHistory, ChatMessage } from '@/ai/schemas/chat';
import { ScrollArea } from './ui/scroll-area';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatHistory>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const botResponse = await chat(newMessages);
      const botMessage: ChatMessage = { role: 'model', parts: [{ text: botResponse }] };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting. Please try again later." }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        // @ts-ignore
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);


  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleToggle} size="icon" className="rounded-full w-14 h-14 shadow-lg">
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">ClassHub Assistant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-80 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                        key={index}
                        className={cn(
                            'flex items-end gap-2',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                        >
                        {message.role === 'model' && (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs"><Bot/></AvatarFallback>
                            </Avatar>
                        )}
                        <div
                            className={cn(
                            'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                            message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                        >
                            {message.parts[0].text}
                        </div>
                        {message.role === 'user' && (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">U</AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-end gap-2 justify-start">
                             <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs"><Bot/></AvatarFallback>
                            </Avatar>
                            <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted">
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 delay-0"></span>
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 delay-150"></span>
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
