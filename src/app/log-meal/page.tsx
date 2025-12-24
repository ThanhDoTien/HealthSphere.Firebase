"use client";

import { useState } from "react";
import {
  nutritionLoggingWithImageRecognition,
  NutritionLoggingOutput,
} from "@/ai/flows/nutrition-logging-with-image-recognition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Camera, Apple, Loader2, List, Sparkles } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type FoodItem = {
  name: string;
  calories: number;
};

export default function LogMealPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<NutritionLoggingOutput | null>(null);
  const [loggedFoods, setLoggedFoods] = useState<FoodItem[]>([
    { name: "Oatmeal with berries", calories: 350 },
    { name: "Grilled Chicken Salad", calories: 450 },
  ]);
  const [manualFood, setManualFood] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAiResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRecognition = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setAiResult(null);
    try {
      const result = await nutritionLoggingWithImageRecognition({
        photoDataUri: image,
      });
      setAiResult(result);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualAdd = () => {
    if (manualFood && manualCalories) {
      setLoggedFoods([
        ...loggedFoods,
        { name: manualFood, calories: Number(manualCalories) },
      ]);
      setManualFood("");
      setManualCalories("");
    }
  };

  const totalCalories = loggedFoods.reduce((sum, food) => sum + food.calories, 0);
  const defaultMealImage = PlaceHolderImages.find((p) => p.id === "meal-1");

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Log Your Meal"
        description="Add your meals to track your daily nutrition and calorie intake."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera /> Log with a Photo
              </CardTitle>
              <CardDescription>
                Use AI to automatically identify your meal from a picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/20"
              >
                {image ? (
                  <Image
                    src={image}
                    alt="Meal"
                    width={600}
                    height={400}
                    className="max-h-full w-auto object-contain rounded-md"
                  />
                ) : (
                  defaultMealImage && 
                  <Image
                    src={defaultMealImage.imageUrl}
                    alt="Placeholder meal"
                    width={600}
                    height={400}
                    className="h-full w-full object-cover rounded-md opacity-30"
                    data-ai-hint={defaultMealImage.imageHint}
                  />
                )}
              </div>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <Button onClick={handleImageRecognition} disabled={!image || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Analyze Meal
                  </>
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {aiResult && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>AI Analysis Complete!</AlertTitle>
                  <AlertDescription>
                    <p className="font-semibold">Identified Items:</p>
                    <p>{aiResult.foodItems.join(', ')}</p>
                    <p className="font-semibold mt-2">Estimated Nutrition:</p>
                    <p>{aiResult.estimatedNutritionalContent}</p>
                    <Button size="sm" className="mt-4" onClick={() => {
                        setLoggedFoods([...loggedFoods, { name: aiResult.foodItems.join(', '), calories: parseInt(aiResult.estimatedNutritionalContent.match(/\d+/)?.[0] || '0') }])
                    }}>Add to Log</Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple /> Log Manually
              </CardTitle>
              <CardDescription>
                Can't take a photo? Add your food items by name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="food-name">Food / Meal</Label>
                  <Input id="food-name" placeholder="e.g. Apple" value={manualFood} onChange={e => setManualFood(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="calories">Calories (kcal)</Label>
                  <Input id="calories" type="number" placeholder="e.g. 95" value={manualCalories} onChange={e => setManualCalories(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleManualAdd}>Add Food</Button>
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List /> Today's Log
              </CardTitle>
              <CardDescription>
                A summary of the meals you've logged today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {loggedFoods.map((food, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span>{food.name}</span>
                    <span className="font-medium">{food.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>{totalCalories} kcal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
