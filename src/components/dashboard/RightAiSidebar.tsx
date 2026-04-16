import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Utensils, 
  Dumbbell, 
  RefreshCw, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb,
  Clock,
  ChevronRight,
  Zap,
  Coffee,
  Leaf,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from '@/context/LanguageContext';
import { getHealthSuggestions, type HealthSuggestionResponse } from '@/ai/flows/suggestion-flow';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import SuggestImage from './SuggestImage';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
 
interface RightAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
 
interface SuggestionWithMetadata extends HealthSuggestionResponse {
  updatedAt?: any;
  snapshotSummary?: {
    caloriesConsumed: number;
    caloriesBurned: number;
  };
}
 
type WeightLog = {
  weight: number;
  date: string;
};
 
export default function RightAiSidebar({ isOpen, onClose }: RightAiSidebarProps) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const [today, setToday] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for Detail View
  const [selectedItem, setSelectedItem] = useState<{
    type: 'meal' | 'workout';
    data: any;
  } | null>(null);
 
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
  }, []);
 
  const latestWeightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(1));
  }, [firestore, user]);
 
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
 
  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);
 
  const { data: latestWeightData } = useCollection<WeightLog>(latestWeightQuery);
  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<SuggestionWithMetadata>(suggestionDocRef);
 
  const dailySummary = useMemo(() => {
    const summary = { 
      caloriesConsumed: 0, 
      caloriesBurned: 0, 
      baseBurned: 0, 
      exerciseBurned: 0, 
      sleepHours: 0 
    };
    
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum, meal: any) => sum + meal.calories, 0);
 
    if (userProfile) {
      const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = activityData ? activityData.reduce((sum, activity: any) => sum + activity.caloriesBurned, 0) : 0;
      
      summary.baseBurned = Math.round(tdee);
      summary.exerciseBurned = Math.round(activityBurn);
      summary.caloriesBurned = summary.baseBurned + summary.exerciseBurned;
    }
 
    if (sleepData) summary.sleepHours = sleepData.reduce((sum, sleep: any) => sum + sleep.duration, 0);
    
    return summary;
  }, [mealData, activityData, sleepData, userProfile, latestWeightData]);
 
  const isStale = useMemo(() => {
    if (!suggestionData || !suggestionData.snapshotSummary || isGenerating) return false;
    const diffConsumed = Math.abs(dailySummary.caloriesConsumed - (suggestionData.snapshotSummary.caloriesConsumed || 0));
    const diffBurned = Math.abs(dailySummary.caloriesBurned - (suggestionData.snapshotSummary.caloriesBurned || 0));
    return diffConsumed > 50 || diffBurned > 50;
  }, [dailySummary, suggestionData, isGenerating]);
 
  const handleGenerateSuggestions = useCallback(async () => {
    if (!userProfile || !user || !today || !suggestionDocRef) return;
    setIsGenerating(true);
    try {
      const token = await user.getIdToken();
      const suggestions = await getHealthSuggestions({
        userProfile: {
          goal: userProfile.goal,
          weight: latestWeightData?.[0]?.weight || userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        recentActivities: [],
        language: locale,
        token,
      });
 
      await setDoc(suggestionDocRef, {
        ...suggestions,
        updatedAt: serverTimestamp(),
        snapshotSummary: {
          caloriesConsumed: dailySummary.caloriesConsumed,
          caloriesBurned: dailySummary.caloriesBurned,
        }
      });
    } catch (err) {
      console.error("AI Sidebar Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, locale, latestWeightData]);
 
  useEffect(() => {
    if (!suggestionLoading && !isGenerating && today && userProfile) {
      if (!suggestionData || isStale) {
        handleGenerateSuggestions();
      }
    }
  }, [suggestionLoading, suggestionData, isGenerating, today, userProfile, isStale, handleGenerateSuggestions]);
 
  return (
    <>
      <aside
        className={cn(
          "relative flex flex-col border-l bg-background/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 h-[calc(100vh-80px)] overflow-hidden shrink-0",
          "lg:w-[30%] lg:opacity-100", // Fixed 30% on desktop
          isOpen ? "w-96 opacity-100" : "w-0 lg:w-[30%] opacity-0 lg:opacity-100 border-none lg:border-l"
        )}
      >
        <div className={cn(
          "flex flex-col h-full w-full transition-opacity duration-300",
          (isOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) ? "opacity-100" : "opacity-0"
        )}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary fill-primary/20" />
              <h3 className="font-black text-lg tracking-tight uppercase">Gợi ý từ AI</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              className={cn("h-10 w-10 rounded-full", isStale && "text-primary animate-pulse bg-primary/10")}
            >
              <RefreshCw className={cn("h-5 w-5", isGenerating && "animate-spin")} />
            </Button>
          </div>
 
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
            {/* Meals Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  {t('ai.mealsTitle')}
                </h4>
              </div>
              
              <div className="space-y-6">
                {(isGenerating || suggestionLoading) && !suggestionData ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-64 w-full rounded-3xl bg-muted animate-pulse" />
                  ))
                ) : suggestionData?.mealSuggestions?.map((meal, idx) => (
                  <Card 
                    key={idx} 
                    className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer rounded-3xl"
                    onClick={() => setSelectedItem({ type: 'meal', data: meal })}
                  >
                    <div className="relative h-56">
                      <SuggestImage 
                        name={meal.name} 
                        prompt={meal.name} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                        <div className="flex justify-between items-end">
                          <h5 className="font-black text-white text-lg leading-tight line-clamp-2 drop-shadow-md">{meal.name}</h5>
                          <span className="text-xs font-black text-white px-3 py-1.5 bg-primary/90 backdrop-blur-md rounded-xl shrink-0 ml-4 shadow-lg">
                            {meal.calories} kcal
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5 bg-card/80 backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic mb-4">
                        {meal.recipe.replaceAll('\\n', ' ')}
                      </p>
                      <div className="flex items-center justify-between">
                         <div className="flex gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Carbs: {meal.carbs || '?'}g</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Prot: {meal.protein || '?'}g</span>
                         </div>
                         <Button variant="link" className="h-auto p-0 text-primary font-black text-xs group/btn">
                            Xem thêm <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
 
            {/* Workout Section */}
            <div className="space-y-6 pb-10">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-accent" />
                  {t('ai.workoutTitle')}
                </h4>
              </div>
              
              <div className="space-y-6">
                {(isGenerating || suggestionLoading) && !suggestionData ? (
                  Array(1).fill(0).map((_, i) => (
                    <div key={i} className="h-64 w-full rounded-3xl bg-muted animate-pulse" />
                  ))
                ) : suggestionData?.workoutSuggestion?.map((exercise, idx) => (
                  <Card 
                    key={idx} 
                    className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer rounded-3xl"
                    onClick={() => setSelectedItem({ type: 'workout', data: exercise })}
                  >
                     <div className="relative h-56">
                      <SuggestImage 
                        name={exercise.name} 
                        prompt={exercise.name + ' fitness exercise high quality'} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                        <h5 className="font-black text-white text-lg leading-tight drop-shadow-md">{exercise.name}</h5>
                      </div>
                    </div>
                    <CardContent className="p-5 bg-card/80 backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2 mb-4">
                        {exercise.description.replaceAll('\\n', ' ')}
                      </p>
                      <div className="flex justify-end">
                        <Button variant="link" className="h-auto p-0 text-accent font-black text-xs group/btn">
                          Xem thêm <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
 
      {/* DETAIL DRAWER (Dialog) */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          {selectedItem && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="relative h-64 sm:h-80 shrink-0">
                <SuggestImage 
                  name={selectedItem.data.name} 
                  prompt={selectedItem.data.name + (selectedItem.type === 'workout' ? ' fitness' : ' meal')} 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute top-4 right-12 z-10">
                   {selectedItem.type === 'meal' && (
                      <div className="px-4 py-2 bg-primary text-white rounded-2xl font-black shadow-lg">
                         {selectedItem.data.calories} kcal
                      </div>
                   )}
                </div>
              </div>
 
              <div className="px-8 pb-10 overflow-y-auto no-scrollbar">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-3xl font-black tracking-tight mb-2">
                    {selectedItem.data.name}
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium text-muted-foreground italic">
                    {selectedItem.type === 'meal' ? 'Recommended Nutritional Meal Plan' : 'Personalized Workout Routine'}
                  </DialogDescription>
                </DialogHeader>
 
                {selectedItem.type === 'meal' && (
                  <div className="grid grid-cols-4 gap-4 mb-10 pb-10 border-b border-primary/10">
                    {[
                      { label: 'Prot', val: selectedItem.data.protein || '?', unit: 'g', color: 'bg-green-100 text-green-700', icon: Zap },
                      { label: 'Carbs', val: selectedItem.data.carbs || '?', unit: 'g', color: 'bg-blue-100 text-blue-700', icon: Coffee },
                      { label: 'Fat', val: selectedItem.data.fat || '?', unit: 'g', color: 'bg-orange-100 text-orange-700', icon: Zap },
                      { label: 'Fiber', val: selectedItem.data.fiber || '?', unit: 'g', color: 'bg-purple-100 text-purple-700', icon: Leaf },
                    ].map((macro, i) => (
                      <div key={i} className={cn("p-4 rounded-3xl flex flex-col items-center justify-center gap-1", macro.color)}>
                        <macro.icon className="h-4 w-4 opacity-70 mb-1" />
                        <span className="text-xl font-black leading-none">{macro.val}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{macro.label}</span>
                      </div>
                    ))}
                  </div>
                )}
 
                <div className="space-y-6">
                   <h6 className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-primary">
                      <div className="h-1 w-8 bg-primary rounded-full" />
                      {selectedItem.type === 'meal' ? 'HƯỚNG DẪN CHẾ BIẾN' : 'CÁCH THỰC HIỆN'}
                   </h6>
                   <div className="space-y-4">
                      {(selectedItem.data.recipe || selectedItem.data.description || "")
                        .split(/\r?\n|\\\\n|(?=Bước \d:)/g)
                        .map((s: string) => s.trim())
                        .filter((s: string) => s.length > 5)
                        .map((step: string, i: number) => (
                          <div key={i} className="flex gap-4 group">
                             <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                {i + 1}
                             </div>
                             <p className="text-sm font-medium leading-relaxed pt-1.5">{step.replace(/^Bước \d:\s*/, '')}</p>
                          </div>
                      ))}
                   </div>
                </div>
 
                <div className="mt-12 p-6 bg-accent/5 rounded-3xl border border-accent/10 flex items-start gap-4">
                   <Info className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                   <p className="text-xs font-medium text-muted-foreground italic leading-relaxed">
                      Lưu ý: Các thông số trên là ước tính dựa trên dữ liệu chuẩn. Hãy điều chỉnh khẩu phần phù hợp với thể trạng cá nhân của bạn.
                   </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
