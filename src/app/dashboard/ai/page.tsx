
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { healthChat } from '@/ai/flows/chat-flow';
import {
  Loader2,
  Send,
  Sparkles,
  User,
  Bot,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function AiChatPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const mealsQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), where('date', '==', today));
  }, [firestore, user, today]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), where('date', '==', today));
  }, [firestore, user, today]);

  const sleepQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), where('date', '==', today));
  }, [firestore, user, today]);

  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);

  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0 };
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum: number, m: any) => sum + m.calories, 0);
    if (userProfile) {
      const bmr = calculateBMR(userProfile.weight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = activityData ? activityData.reduce((sum: number, a: any) => sum + a.caloriesBurned, 0) : 0;
      summary.caloriesBurned = tdee + activityBurn;
    }
    if (sleepData) summary.sleepHours = sleepData.reduce((sum: number, s: any) => sum + s.duration, 0);
    return summary;
  }, [mealData, activityData, sleepData, userProfile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !userProfile) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const botResponse = await healthChat({
        message: userMsg,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        userProfile: {
          name: userProfile.name,
          goal: userProfile.goal,
          weight: userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        language: locale,
      });

      setMessages(prev => [...prev, { role: 'model', content: botResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: t('ai.errorMessage') }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4 sm:p-6 overflow-hidden">
      <Card className="flex flex-1 flex-col overflow-hidden shadow-lg border-primary/20 bg-card">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('ai.title')}</CardTitle>
              <CardDescription>{t('ai.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-50 space-y-4">
              <Bot className="h-16 w-16" />
              <p className="max-w-[250px]">{t('ai.chatbot.welcome')}</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex w-full items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted/80 text-foreground rounded-tl-none border border-border/50"
              )}>
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex w-full items-start gap-3 animate-pulse">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-muted/50 border px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t bg-background p-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder={t('ai.chatbot.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 rounded-full px-4 focus-visible:ring-primary h-11"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isTyping || !input.trim()}
              className="h-11 w-11 rounded-full shadow-md"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
