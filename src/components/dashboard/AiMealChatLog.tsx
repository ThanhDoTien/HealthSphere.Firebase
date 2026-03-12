
'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles, Utensils, Info } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AiMealChatLogProps {
  userId: string;
}

export default function AiMealChatLog({ userId }: AiMealChatLogProps) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeMealOutput | null>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const handleSend = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userText = input.trim();
    setInput('');
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeMealText({ text: userText, language: locale });
      setAnalysis(result);
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
    if (!analysis || !userId) return;

    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
      userId,
      name: `AI: ${analysis.name}`,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      fiber: analysis.fiber,
      mealType,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addDoc(mealLogRef, mealLogData);
      toast({
        title: t('form.common.success'),
        description: t('form.add_meal.success', { name: analysis.name }),
      });
      setAnalysis(null);
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
    <div className="space-y-4">
      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="rounded-2xl bg-muted/50 px-4 py-2 text-sm border">
          <p>{t('ai.chatbot.mealQuestion') || 'Hôm nay bạn đã ăn gì?'}</p>
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Utensils className="h-4 w-4" />
              <span>{analysis.name}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="rounded-md bg-background p-2 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase">{t('ai.calories') || 'Calo'}</p>
                <p className="text-sm font-bold">{analysis.calories}</p>
              </div>
              <div className="rounded-md bg-background p-2 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase">Protein</p>
                <p className="text-sm font-bold">{analysis.protein}g</p>
              </div>
              <div className="rounded-md bg-background p-2 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase">Carbs</p>
                <p className="text-sm font-bold">{analysis.carbs}g</p>
              </div>
              <div className="rounded-md bg-background p-2 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase">Fat</p>
                <p className="text-sm font-bold">{analysis.fat}g</p>
              </div>
              <div className="rounded-md bg-background p-2 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase">{t('ai.fiber') || 'Xơ'}</p>
                <p className="text-sm font-bold">{analysis.fiber}g</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground italic">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <p>{analysis.explanation}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Select value={mealType} onValueChange={(v: any) => setMealType(v)}>
                <SelectTrigger className="h-9 text-xs">
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
                <Button size="sm" className="flex-1" onClick={handleConfirm}>
                  {t('form.add_meal.button')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAnalysis(null)}>
                  {t('form.common.cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('ai.chatbot.mealPlaceholder') || 'Mô tả bữa ăn của bạn... (VD: 1 bát phở bò)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnalyzing}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 rounded-full px-4 h-10"
        />
        <Button 
          size="icon" 
          onClick={handleSend} 
          disabled={isAnalyzing || !input.trim()}
          className="h-10 w-10 rounded-full shrink-0"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
