'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2, ChevronsRight, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recognizeFood, type RecognizeFoodResponse } from '@/ai/flows/recognize-food-flow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '../ui/label';
import { useTranslation } from '@/context/LanguageContext';

interface LogMealWithAiDialogProps {
  userId: string;
}

const BACKEND_URL = "https://healthsphere-8kji.onrender.com";

export default function LogMealWithAiDialog({ userId }: LogMealWithAiDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RecognizeFoodResponse | null>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const getCameraPermission = async () => {
      if (open && !capturedImage) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoElement) {
            videoElement.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      }
    };
    getCameraPermission();
    
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }
    }
  }, [open, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUrl);
    handleAnalyze(imageDataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        handleAnalyze(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await recognizeFood({ photoDataUri: imageDataUrl });
      setAnalysisResult(result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('dialog.ai_meal.analysisFailed'),
        description: error.message || t('dialog.ai_meal.analysisError'),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysisResult || !userId) return;

    const mealName = analysisResult.identifiedFoods.map(f => f.name).join(', ') || 'AI Logged Meal';
    const totalCalories = analysisResult.totalCalories;

    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
        userId,
        name: `AI: ${mealName}`,
        calories: totalCalories,
        mealType,
        date: new Date().toISOString().split('T')[0],
    };

    try {
      await addDoc(mealLogRef, mealLogData);
      
      const syncPayload = {
        id: 0,
        userId: userId, 
        mealName: `AI: ${mealName}`,
        calories: totalCalories,
        protein: 0,
        carbs: 0,
        fat: 0,
        imageUrl: capturedImage || "",
        type: mealType,
        createdAt: new Date().toISOString()
      };

      fetch(`${BACKEND_URL}/api/MealLogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      }).catch(err => console.error("Sync error:", err));

      toast({
        title: t('form.common.success'),
        description: t('dialog.ai_meal.logSuccess', {calories: totalCalories }),
      });
      resetAndClose();
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
        description: t('dialog.ai_meal.logError'),
      });
    }
  };

  const resetAndClose = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setOpen(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            resetAndClose();
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            {t('dialog.ai_meal.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.ai_meal.title')}</DialogTitle>
        </DialogHeader>
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
        <div className="space-y-4 py-4">
           {!capturedImage ? (
                <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                       <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    </div>
                    {hasCameraPermission === false && (
                         <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
                            <AlertTitle>{t('dialog.ai_meal.cameraError')}</AlertTitle>
                            <AlertDescription>
                                {t('dialog.ai_meal.cameraErrorDescription')}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleCapture} disabled={hasCameraPermission === false}>
                            <Camera className="mr-2 h-4 w-4" />
                            {t('dialog.ai_meal.captureButton')}
                        </Button>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('dialog.ai_meal.uploadButton')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                        <Image src={capturedImage} alt="Captured meal" fill className="object-cover" />
                    </div>

                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>{t('dialog.ai_meal.analyzing')}</span>
                        </div>
                    )}
                    
                    {analysisResult && (
                       <div className="space-y-4">
                            {analysisResult.identifiedFoods.length > 0 ? (
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-lg">{t('dialog.ai_meal.analysisResult')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 p-4 pt-0">
                                        {analysisResult.identifiedFoods.map((food, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span>{food.name}</span>
                                                <span className="font-medium">{food.calories} kcal</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t pt-2 font-bold">
                                            <span>{t('dialog.ai_meal.total')}</span>
                                            <span>{analysisResult.totalCalories} kcal</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : !isAnalyzing && (
                                <Alert>
                                    <AlertTitle>{t('dialog.ai_meal.noFoodTitle')}</AlertTitle>
                                    <AlertDescription>
                                        {t('dialog.ai_meal.noFoodDescription')}
                                    </AlertDescription>
                                </Alert>
                            )}
                       </div>
                    )}
                </div>
            )}
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {analysisResult && analysisResult.identifiedFoods.length > 0 ? (
                <>
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="mealType-ai" className="sr-only">{t('form.add_meal.typeLabel')}</Label>
                    <Select value={mealType} onValueChange={(value) => setMealType(value as any)}>
                        <SelectTrigger id="mealType-ai">
                            <SelectValue placeholder={t('form.add_meal.typePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="breakfast">{t('form.add_meal.typeBreakfast')}</SelectItem>
                            <SelectItem value="lunch">{t('form.add_meal.typeLunch')}</SelectItem>
                            <SelectItem value="dinner">{t('form.add_meal.typeDinner')}</SelectItem>
                            <SelectItem value="snack">{t('form.add_meal.typeSnack')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleLogMeal}>
                    <ChevronsRight className="mr-2 h-4 w-4" />
                    {t('dialog.ai_meal.logButton')}
                </Button>
                </>
            ) : capturedImage ? (
                 <Button variant="outline" onClick={() => { setCapturedImage(null); setAnalysisResult(null); }} className="col-span-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('dialog.ai_meal.tryAgainButton')}
                </Button>
            ) : null }
            
             <DialogClose asChild className="col-span-full">
                <Button variant="ghost">
                    {t('form.common.cancel')}
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
