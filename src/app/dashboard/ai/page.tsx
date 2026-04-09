// ==========================================
// FILE: src/app/dashboard/ai/page.tsx
// MỤC ĐÍCH: Trang Trò chuyện AI Sức khỏe (AI Health Chatbot)
// TỔNG QUAN: Giao diện chat toàn màn hình với AI chuyên gia sức khỏe.
// AI được nạp toàn bộ dữ liệu cá nhân (bữa ăn, hoạt động, giấc ngủ, cân nặng)
// để đưa ra tư vấn cá nhân hóa. Hỗ trợ xóa lịch sử trò chuyện.
// ==========================================

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
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { healthChat } from '@/ai/flows/chat-flow';
import {
  Loader2,
  Send,
  Sparkles,
  User,
  Bot,
  Trash2,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { cn } from '@/lib/utils';
import { deleteDoc, getDocs } from 'firebase/firestore';

export default function AiChatPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  // Lấy lịch sử chat
  const chatQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, user]);

  const { data: messages } = useCollection(chatQuery);

  // Truy vấn TOÀN BỘ dữ liệu lịch sử (giới hạn 30 mục gần nhất cho mỗi loại để tối ưu token)
  const fullMealsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user]);

  const fullActivitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user]);

  const fullSleepQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user]);

  const fullWeightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user]);

  const { data: allMeals } = useCollection(fullMealsQuery);
  const { data: allActivities } = useCollection(fullActivitiesQuery);
  const { data: allSleep } = useCollection(fullSleepQuery);
  const { data: allWeights } = useCollection(fullWeightQuery);

  // Tính toán tóm tắt hôm nay từ dữ liệu đã lấy
  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, baseBurned: 0, exerciseBurned: 0, sleepHours: 0 };
    if (allMeals) {
      summary.caloriesConsumed = allMeals
        .filter((m: any) => m.date === todayStr)
        .reduce((sum: number, m: any) => sum + m.calories, 0);
    }
    if (userProfile) {
      const currentWeight = allWeights?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = allActivities 
        ? allActivities.filter((a: any) => a.date === todayStr).reduce((sum: number, a: any) => sum + a.caloriesBurned, 0) 
        : 0;
      
      summary.baseBurned = Math.round(tdee);
      summary.exerciseBurned = Math.round(activityBurn);
      summary.caloriesBurned = summary.baseBurned + summary.exerciseBurned;
    }
    if (allSleep) {
      summary.sleepHours = allSleep
        .filter((s: any) => s.date === todayStr)
        .reduce((sum: number, s: any) => sum + s.duration, 0);
    }
    return summary;
  }, [allMeals, allActivities, allSleep, allWeights, userProfile, todayStr]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return locale === 'vi' ? 'Hôm nay' : 'Today';
    if (isYesterday) return locale === 'vi' ? 'Hôm qua' : 'Yesterday';
    
    return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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
          weight: allWeights?.[0]?.weight || userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        // Truyền dữ liệu lịch sử vào Flow
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
      await addDoc(chatRef, {
        role: 'model',
        content: t('ai.errorMessage'),
        createdAt: serverTimestamp(),
      });
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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4 sm:p-6 overflow-hidden">
      <Card className="flex flex-1 flex-col overflow-hidden shadow-lg border-primary/20 bg-card">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('ai.title')}</CardTitle>
                <CardDescription>{t('ai.description')}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearChat} title="Xóa lịch sử">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          {(!messages || messages.length === 0) && !isTyping && (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-50 space-y-4">
              <Bot className="h-16 w-16" />
              <p className="max-w-[250px]">{t('ai.chatbot.welcome')}</p>
            </div>
          )}

          {messages?.map((msg, idx) => {
            const currentMsgDate = msg.createdAt?.toDate ? msg.createdAt.toDate().toDateString() : new Date(msg.createdAt).toDateString();
            const prevMsgDate = idx > 0 ? (messages[idx - 1].createdAt?.toDate ? messages[idx - 1].createdAt.toDate().toDateString() : new Date(messages[idx - 1].createdAt).toDateString()) : null;
            const showDateHeader = currentMsgDate !== prevMsgDate;

            return (
              <div key={msg.id || idx} className="space-y-6">
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex w-full items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm mt-1",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "flex flex-col gap-1 max-w-[80%]",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2 text-sm shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted/80 text-foreground rounded-tl-none border border-border/50"
                    )}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

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
