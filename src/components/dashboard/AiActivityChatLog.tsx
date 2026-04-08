'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Flame, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/context/LanguageContext';
import { analyzeActivityText, type AnalyzeActivityOutput } from '@/ai/flows/analyze-activity-text-flow';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  analysis?: AnalyzeActivityOutput['activityData'];
}

interface AiActivityChatLogProps {
  userId: string;
}

export default function AiActivityChatLog({ userId }: AiActivityChatLogProps) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: t('ai.chatbot.activityQuestion') || 'Bạn đã tập luyện gì hôm nay?' }
  ]);

  const latestAnalysis = messages.filter(m => m.analysis).slice(-1)[0]?.analysis;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing]);

  const handleSend = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsAnalyzing(true);

    try {
      const result = await analyzeActivityText({ 
        text: userText, 
        language: locale,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: result.explanation,
        analysis: result.activityData || undefined
      }]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: error.message || 'AI error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!latestAnalysis || !userId) return;

    const activityLogRef = collection(firestore, `users/${userId}/activities`);
    const activityLogData = {
      userId,
      name: latestAnalysis.name,
      duration: latestAnalysis.duration,
      caloriesBurned: latestAnalysis.caloriesBurned,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addDoc(activityLogRef, activityLogData);
      toast({
        title: t('form.common.success'),
        description: t('form.add_activity.success', { name: latestAnalysis.name }),
      });
      setMessages([{ role: 'model', content: t('ai.chatbot.activityQuestion') || 'Bạn đã tập luyện gì hôm nay?' }]);
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: activityLogRef.path,
          operation: 'create',
          requestResourceData: activityLogData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_activity.error'),
      });
    }
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-2xl bg-card overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={cn(
            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
            msg.role === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              msg.role === 'user' 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-muted text-foreground rounded-tl-none border border-border/50"
            )}>
              <div className="flex items-center gap-2 mb-1">
                {msg.role === 'model' && <Sparkles className="h-3 w-3 text-primary" />}
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>

              {msg.analysis && (
                <div className="mt-3 p-3 bg-background/50 rounded-xl border border-accent/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-accent">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{msg.analysis.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('activity.chart.calories')}:</span>
                    <span className="font-bold">{msg.analysis.caloriesBurned} kcal</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('form.add_activity.durationLabel')}:</span>
                    <span className="font-bold">{msg.analysis.duration} {t('activity.unit.minutes')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 border flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{t('ai.thinking')}</span>
            </div>
          </div>
        )}
      </div>

      {latestAnalysis && (
        <div className="bg-accent/5 border-t border-accent/20 p-3 flex gap-2">
          <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90" onClick={handleConfirm}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('form.add_activity.button')}
          </Button>
        </div>
      )}

      <div className="p-4 border-t bg-muted/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder={t('ai.chatbot.activityPlaceholder') || 'Mô tả hoạt động...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isAnalyzing}
            className="flex-1 rounded-full px-4 h-10 border-border/50 shadow-inner"
          />
          <Button 
            type="submit"
            size="icon" 
            disabled={isAnalyzing || !input.trim()}
            className="h-10 w-10 rounded-full shadow-md shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
