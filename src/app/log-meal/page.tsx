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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";


type FoodItem = {
  name: string;
  calories: number;
};

const calorieData = [
  { date: "T2", calories: 2100 },
  { date: "T3", calories: 1950 },
  { date: "T4", calories: 2250 },
  { date: "T5", calories: 1800 },
  { date: "T6", calories: 2400 },
  { date: "T7", calories: 2600 },
  { date: "CN", calories: 2300 },
];

const calorieChartConfig = {
  calories: {
    label: "Lượng calo nạp vào",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function LogMealPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<NutritionLoggingOutput | null>(null);
  const [loggedFoods, setLoggedFoods] = useState<FoodItem[]>([
    { name: "Bột yến mạch với quả mọng", calories: 350 },
    { name: "Salad gà nướng", calories: 450 },
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
      setError("Không thể phân tích hình ảnh. Vui lòng thử lại.");
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
        title="Ghi lại bữa ăn của bạn"
        description="Thêm bữa ăn của bạn để theo dõi dinh dưỡng và lượng calo hàng ngày."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera /> Ghi lại bằng ảnh
              </CardTitle>
              <CardDescription>
                Sử dụng AI để tự động xác định bữa ăn của bạn từ một bức ảnh.
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Phân tích bữa ăn
                  </>
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {aiResult && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Phân tích AI hoàn tất!</AlertTitle>
                  <AlertDescription>
                    <p className="font-semibold">Các món đã xác định:</p>
                    <p>{aiResult.foodItems.join(', ')}</p>
                    <p className="font-semibold mt-2">Dinh dưỡng ước tính:</p>
                    <p>{aiResult.estimatedNutritionalContent}</p>
                    <Button size="sm" className="mt-4" onClick={() => {
                        setLoggedFoods([...loggedFoods, { name: aiResult.foodItems.join(', '), calories: parseInt(aiResult.estimatedNutritionalContent.match(/\d+/)?.[0] || '0') }])
                    }}>Thêm vào nhật ký</Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lượng calo nạp vào - 7 ngày qua</CardTitle>
              <CardDescription>
                Biểu đồ này cho thấy lượng calo tiêu thụ hàng ngày của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={calorieChartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={calorieData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      label={{ value: "kcal", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="calories" fill="var(--color-calories)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple /> Ghi lại thủ công
              </CardTitle>
              <CardDescription>
                Không thể chụp ảnh? Thêm các món ăn của bạn theo tên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="food-name">Thực phẩm / Bữa ăn</Label>
                  <Input id="food-name" placeholder="ví dụ: Táo" value={manualFood} onChange={e => setManualFood(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="calories">Lượng calo (kcal)</Label>
                  <Input id="calories" type="number" placeholder="ví dụ: 95" value={manualCalories} onChange={e => setManualCalories(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleManualAdd}>Thêm thực phẩm</Button>
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List /> Nhật ký hôm nay
              </CardTitle>
              <CardDescription>
                Tóm tắt các bữa ăn bạn đã ghi lại hôm nay.
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
                <span>Tổng cộng</span>
                <span>{totalCalories} kcal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
