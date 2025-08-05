
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, X } from 'lucide-react';
import { chat } from '@/ai/flows/resources-chatbot-flow';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

type Message = {
    role: 'user' | 'bot';
    content: string;
};

export function ResourcesChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const botResponse = await chat({ query: input });
            const botMessage: Message = { role: 'bot', content: botResponse };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage: Message = { role: 'bot', content: 'Sorry, I am having trouble connecting. Please try again later.' };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px] flex flex-col h-[70vh]">
                    <DialogHeader>
                        <DialogTitle>Resources Assistant</DialogTitle>
                        <DialogDescription>
                            I can help you find resources. What are you looking for?
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-grow p-4 -mx-6" ref={scrollAreaRef}>
                        <div className="space-y-4 pr-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'bot' && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback><Bot /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg px-3 py-2 bg-muted w-2/3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3 mt-2" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about project ideas..."
                            disabled={loading}
                        />
                        <Button type="submit" size="icon" disabled={loading}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                 <span className="sr-only">Toggle Chatbot</span>
            </Button>
        </>
    );
}
