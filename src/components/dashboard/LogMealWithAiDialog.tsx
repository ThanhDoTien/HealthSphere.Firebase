'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2, ChevronsRight, RotateCcw } from 'lucide-react';
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

interface LogMealWithAiDialogProps {
  userId: string;
}

export default function LogMealWithAiDialog({ userId }: LogMealWithAiDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
      if (open) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoElement) {
            videoElement.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
          setOpen(false);
        }
      }
    };
    getCameraPermission();
    
    return () => {
        // Stop camera stream when component unmounts or dialog closes
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }
    }
  }, [open, toast]);

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

  const handleAnalyze = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await recognizeFood({ photoDataUri: imageDataUrl });
      setAnalysisResult(result);
      if (result.identifiedFoods.length === 0) {
        toast({
            variant: 'default',
            title: 'No food detected',
            description: 'The AI could not detect any food in the image. Please try again.'
        });
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'The AI could not analyze the image. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = () => {
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

    addDoc(mealLogRef, mealLogData)
      .then(() => {
        toast({
          title: 'Success!',
          description: `Meal logged with ${totalCalories} calories.`,
        });
        resetAndClose();
      })
      .catch((error) => {
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
          title: 'Error',
          description: 'Could not log your meal. Please try again.',
        });
      });
  };

  const resetAndClose = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setOpen(false);
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
            Log Meal with Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Meal with AI</DialogTitle>
        </DialogHeader>
        <canvas ref={canvasRef} className="hidden" />
        <div className="space-y-4 py-4">
           {!capturedImage ? (
                <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                       <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    </div>
                    {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={handleCapture} className="w-full" disabled={hasCameraPermission === false}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capture Photo
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                        <Image src={capturedImage} alt="Captured meal" fill className="object-cover" />
                    </div>

                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Analyzing your meal...</span>
                        </div>
                    )}
                    
                    {analysisResult && (
                       <div className="space-y-4">
                            {analysisResult.identifiedFoods.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Analysis Result</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {analysisResult.identifiedFoods.map((food, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span>{food.name}</span>
                                                <span className="font-medium">{food.calories} kcal</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t pt-2 font-bold">
                                            <span>Total</span>
                                            <span>{analysisResult.totalCalories} kcal</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : !isAnalyzing && (
                                <Alert>
                                    <AlertTitle>No Food Detected</AlertTitle>
                                    <AlertDescription>
                                        We couldn&apos;t find any food items in your photo. Try again in a well-lit area.
                                    </AlertDescription>
                                </Alert>
                            )}
                       </div>
                    )}
                </div>
            )}
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {analysisResult && analysisResult.identifiedFoods.length > 0 ? (
                <>
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="mealType-ai" className="sr-only">Meal Type</Label>
                    <Select value={mealType} onValueChange={(value) => setMealType(value as any)}>
                        <SelectTrigger id="mealType-ai">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleLogMeal}>
                    <ChevronsRight className="mr-2 h-4 w-4" />
                    Log Meal
                </Button>
                </>
            ) : capturedImage ? (
                 <Button variant="outline" onClick={() => setCapturedImage(null)} className="col-span-2">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            ) : null }
            
             <DialogClose asChild className="col-span-2">
                <Button variant="ghost">
                    Cancel
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
