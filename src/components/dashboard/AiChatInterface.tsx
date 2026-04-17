// ==========================================
// FILE: src/components/dashboard/AiChatInterface.tsx
// MỤC ĐÍCH: Giao diện và Logic trò chuyện AI dùng chung
// TỔNG QUAN: Chứa toàn bộ UI tin nhắn, input và kết nối với chat-flow.
// Dùng cho cả Sidebar AI và trang Chat AI chính.
// ==========================================

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  User, 
  Bot,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, addDoc, serverTimestamp, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { healthChat } from '@/ai/flows/chat-flow';
import { useTranslation } from '@/context/LanguageContext';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/render-markdown';

interface AiChatInterfaceProps {
  className?: string;
  isFullHeight?: boolean;
}

export default function AiChatInterface({ className, isFullHeight = false }: AiChatInterfaceProps) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const chatQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, user]);

  const { data: messages } = useCollection(chatQuery);

  // Lấy dữ liệu sức khỏe làm ngữ cảnh (Context)
  const mealsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), orderBy('date', 'desc'), limit(15));
  }, [firestore, user]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), orderBy('date', 'desc'), limit(15));
  }, [firestore, user]);

  const sleepQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), orderBy('date', 'desc'), limit(15));
  }, [firestore, user]);

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(15));
  }, [firestore, user]);

  const { data: allMeals } = useCollection(mealsQuery);
  const { data: allActivities } = useCollection(activitiesQuery);
  const { data: allSleep } = useCollection(sleepQuery);
  const { data: allWeights } = useCollection(weightQuery);

  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, baseBurned: 0, exerciseBurned: 0, sleepHours: 0 };
    if (userProfile && todayStr) {
      if (allMeals) {
        summary.caloriesConsumed = allMeals.filter((m: any) => m.date === todayStr).reduce((sum, m: any) => sum + m.calories, 0);
      }
      const currentWeight = allWeights?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = allActivities ? allActivities.filter((a: any) => a.date === todayStr).reduce((sum, a: any) => sum + a.caloriesBurned, 0) : 0;
      
      summary.baseBurned = Math.round(tdee);
      summary.exerciseBurned = Math.round(activityBurn);
      summary.caloriesBurned = summary.baseBurned + summary.exerciseBurned;
      
      if (allSleep) {
        summary.sleepHours = allSleep.filter((s: any) => s.date === todayStr).reduce((sum, s: any) => sum + s.duration, 0);
      }
    }
    return summary;
  }, [allMeals, allActivities, allSleep, allWeights, userProfile, todayStr]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
          weight: allWeights?.[0]?.weight || userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        weightHistory: allWeights?.map(w => ({ date: w.date, weight: w.weight })),
        mealHistory: allMeals?.map(m => ({ date: m.date, name: m.name, calories: m.calories, mealType: m.mealType })),
        activityHistory: allActivities?.map(a => ({ date: a.date, name: a.name, duration: a.duration, caloriesBurned: a.caloriesBurned })),
        sleepHistory: allSleep?.map(s => ({ date: s.date, duration: s.duration })),
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
    <div className={cn("flex flex-col overflow-hidden", isFullHeight ? "h-full" : "h-[500px]", className)}>
      {/* Header nội bộ cho Interface */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">{t('ai.chatbot.title') || 'AI Assistant'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={clearChat} title="Xóa lịch sử">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Vùng tin nhắn */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar" ref={scrollRef}>
        {(!messages || messages.length === 0) && !isTyping && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-40 space-y-3 py-10">
            <Bot className="h-10 w-10" />
            <p className="text-[11px] px-6 leading-relaxed font-medium">{t('ai.chatbot.welcome')}</p>
          </div>
        )}

        {messages?.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={cn(
              "flex w-full items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm mt-1",
              msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
            </div>
            <div className={cn(
              "flex flex-col gap-1 max-w-[85%]",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-3 py-2 text-xs shadow-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted/80 text-foreground rounded-tl-none border border-border/30"
              )}>
                <div className="text-xs leading-relaxed space-y-0.5">{renderMarkdown(msg.content)}</div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex w-full items-start gap-2 animate-pulse">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-muted/50 border px-3 py-2 flex items-center h-8">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Input gửi tin tại Interface */}
      <div className="p-3 border-t bg-background/50">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder={t('ai.chatbot.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 rounded-xl px-3 focus-visible:ring-primary h-9 text-[11px] bg-background border-muted-foreground/20"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isTyping || !input.trim()}
            className="h-9 w-9 rounded-xl shadow-sm shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
