
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  MessageCircle, 
  Send, 
  Loader2, 
  User, 
  Bot,
  Trash2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { healthChat } from '@/ai/flows/chat-flow';
import { useTranslation } from '@/context/LanguageContext';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { cn } from '@/lib/utils';

export default function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setTodayStr(`${year}-${month}-${day}`);
  }, []);

  const chatQuery = useMemoFirebase(() => {
    if (!user || !isOpen) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, user, isOpen]);

  const { data: messages } = useCollection(chatQuery);

  const mealsQuery = useMemoFirebase(() => {
    if (!user || !todayStr || !isOpen) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), where('date', '==', todayStr));
  }, [firestore, user, todayStr, isOpen]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!user || !todayStr || !isOpen) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), where('date', '==', todayStr));
  }, [firestore, user, todayStr, isOpen]);

  const sleepQuery = useMemoFirebase(() => {
    if (!user || !todayStr || !isOpen) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), where('date', '==', todayStr));
  }, [firestore, user, todayStr, isOpen]);

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
  }, [messages, isTyping, isOpen, isMinimized]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return locale === 'vi' ? 'Hôm nay' : 'Today';
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return locale === 'vi' ? 'Hôm qua' : 'Yesterday';

    return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || !userProfile || !user) return;

    const userMsg = input.trim();
    setInput('');
    setIsTyping(true);

    const chatRef = collection(firestore, 'users', user.uid, 'chats');

    try {
      await addDoc(chatRef, {
        role: 'user',
        content: userMsg,
        createdAt: serverTimestamp(),
      });

      const botResponse = await healthChat({
        message: userMsg,
        history: messages?.map(m => ({ role: m.role as 'user' | 'model', content: m.content })) || [],
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

      await addDoc(chatRef, {
        role: 'model',
        content: botResponse,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    const chatRef = collection(firestore, 'users', user.uid, 'chats');
    const snapshot = await getDocs(chatRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      {isOpen && (
        <Card className={cn(
          "w-[90vw] sm:w-[400px] shadow-2xl border-primary/30 flex flex-col overflow-hidden pointer-events-auto transition-all duration-300 origin-bottom-right",
          isMinimized ? "h-[60px]" : "h-[550px]"
        )}>
          <CardHeader className="p-3 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">HealthSphere AI</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/10" onClick={clearChat} title="Xóa lịch sử">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-card/50" ref={scrollRef}>
                {(!messages || messages.length === 0) && !isTyping && (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-40 space-y-3 py-10">
                    <Bot className="h-12 w-12" />
                    <p className="text-xs px-6 leading-relaxed">{t('ai.chatbot.welcome')}</p>
                  </div>
                )}

                {messages?.map((msg, idx) => {
                  const currentMsgDate = msg.createdAt?.toDate ? msg.createdAt.toDate().toDateString() : new Date(msg.createdAt).toDateString();
                  const prevMsgDate = idx > 0 ? (messages[idx - 1].createdAt?.toDate ? messages[idx - 1].createdAt.toDate().toDateString() : new Date(messages[idx - 1].createdAt).toDateString()) : null;
                  const showDateHeader = currentMsgDate !== prevMsgDate;

                  return (
                    <div key={msg.id || idx} className="space-y-4">
                      {showDateHeader && (
                        <div className="flex justify-center my-2">
                          <span className="bg-muted px-2 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground uppercase">
                            {formatDateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex w-full items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                          msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm mt-1",
                          msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {msg.role === 'user' ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        </div>
                        <div className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "rounded-2xl px-3 py-2 text-[13px] shadow-sm",
                            msg.role === 'user' 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-muted/90 text-foreground rounded-tl-none border border-border/30"
                          )}>
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-muted-foreground px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex w-full items-start gap-2 animate-pulse">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-muted/50 border px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-3 border-t bg-background">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder={t('ai.chatbot.placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    className="flex-1 rounded-full px-4 focus-visible:ring-primary h-9 text-xs"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isTyping || !input.trim()}
                    className="h-9 w-9 rounded-full shadow-md shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      )}

      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 z-50",
          isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent"></span>
          </span>
        )}
      </Button>
    </div>
  );
}
