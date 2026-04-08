
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Utensils, Info, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/context/LanguageContext';
import { analyzeMealText, type AnalyzeMealOutput } from '@/ai/flows/analyze-meal-text-flow';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  role: 'user' | 'model';
  content: string;
  analysis?: AnalyzeMealOutput['mealData'];
}

interface AiMealChatLogProps {
  userId: string;
}

export default function AiMealChatLog({ userId }: AiMealChatLogProps) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: t('ai.chatbot.mealQuestion') || 'Hôm nay bạn đã ăn gì?' }
  ]);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

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
      const result = await analyzeMealText({ 
        text: userText, 
        language: locale,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: result.explanation,
        analysis: result.mealData || undefined
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

    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
      userId,
      name: `AI: ${latestAnalysis.name}`,
      calories: latestAnalysis.calories,
      protein: latestAnalysis.protein,
      carbs: latestAnalysis.carbs,
      fat: latestAnalysis.fat,
      fiber: latestAnalysis.fiber,
      mealType,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addDoc(mealLogRef, mealLogData);
      toast({
        title: t('form.common.success'),
        description: t('form.add_meal.success', { name: latestAnalysis.name }),
      });
      // Reset chat sau khi lưu thành công
      setMessages([{ role: 'model', content: t('ai.chatbot.mealQuestion') || 'Hôm nay bạn đã ăn gì?' }]);
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: mealLogRef.path,
          operation: 'create',
          requestResourceData: mealLogData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_meal.error'),
      });
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-2xl bg-card overflow-hidden shadow-sm">
      {/* Messages Area */}
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
                <div className="mt-3 p-3 bg-background/50 rounded-xl border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <Utensils className="h-3.5 w-3.5" />
                    <span>{msg.analysis.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-lg bg-background p-1.5 text-center border shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase">{t('ai.calories')}</p>
                      <p className="text-xs font-bold">{msg.analysis.calories}</p>
                    </div>
                    <div className="rounded-lg bg-background p-1.5 text-center border shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase">Prot</p>
                      <p className="text-xs font-bold">{msg.analysis.protein}g</p>
                    </div>
                    <div className="rounded-lg bg-background p-1.5 text-center border shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase">Carb</p>
                      <p className="text-xs font-bold">{msg.analysis.carbs}g</p>
                    </div>
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

      {/* Confirmation Area (Sticky at bottom if analysis exists) */}
      {latestAnalysis && (
        <div className="bg-primary/5 border-t border-primary/20 p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={mealType} onValueChange={(v: any) => setMealType(v)}>
              <SelectTrigger className="h-9 text-xs flex-1 bg-background">
                <SelectValue placeholder={t('form.add_meal.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">{t('form.add_meal.typeBreakfast')}</SelectItem>
                <SelectItem value="lunch">{t('form.add_meal.typeLunch')}</SelectItem>
                <SelectItem value="dinner">{t('form.add_meal.typeDinner')}</SelectItem>
                <SelectItem value="snack">{t('form.add_meal.typeSnack')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 shadow-sm h-9" onClick={handleConfirm}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('form.add_meal.button')}
              </Button>
              <Button size="sm" variant="outline" className="h-9 bg-background" onClick={() => setMessages([{ role: 'model', content: t('ai.chatbot.mealQuestion') || 'Hôm nay bạn đã ăn gì?' }])}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center italic">
            {t('ai.chatbot.refineHint') || 'Bạn có thể chat tiếp để điều chỉnh các con số trên.'}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder={t('ai.chatbot.mealPlaceholder') || 'Mô tả bữa ăn của bạn...'}
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
