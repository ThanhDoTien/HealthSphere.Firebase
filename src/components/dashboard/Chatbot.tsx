'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define the structure for a message
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm your AI Health Assistant. How can I help you today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // API Key and URL for Google Gemini
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // Scroll to the bottom of the chat box when new messages are added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const text = userInput.trim();
    if (!text || isLoading) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setUserInput('');
    setIsLoading(true);

    try {
        // Send request to Gemini API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Get reply from the bot
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I am having trouble connecting. Please try again later.';
        
        // Add bot message to chat
        setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
        console.error("Gemini API error:", error);
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  if (!apiKey) {
    // This is a client component, so we can log to the browser console.
    console.error("Chatbot: Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
    return null; // Don't render the chatbot if the key is missing
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-50 h-16 w-16 rounded-full shadow-lg"
          aria-label="Toggle Chat"
        >
          <Bot className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 shadow-lg sm:w-96">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">AI Assistant</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent ref={chatBoxRef} className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {msg.sender === 'bot' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="h-5 w-5" />
                            </div>
                        )}
                        <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                        >
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                                <div className="flex items-center space-x-1">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground delay-0"></span>
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground delay-150"></span>
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            id="user-input"
                            placeholder="Ask a question..."
                            className="flex-1"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={isLoading || !userInput}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      )}
    </>
  );
};

export default Chatbot;
