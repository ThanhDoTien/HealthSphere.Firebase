"use client";

import { useState, useTransition } from "react";
import { recipeRecommendationsBasedOnLoggedFoods } from "@/ai/flows/recipe-recommendations-based-on-logged-foods";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Loader2, Sparkles, ChefHat } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const initialRecipes = [
  {
    id: 1,
    title: "Gà xào nhanh và tốt cho sức khỏe",
    description:
      "Một bữa tối hoàn hảo cho các ngày trong tuần với nhiều protein và rau củ. Sẵn sàng trong vòng chưa đầy 20 phút!",
    imageId: "recipe-2",
  },
  {
    id: 2,
    title: "Bát sinh tố Berry Blast",
    description:
      "Bắt đầu ngày mới với bát sinh tố giàu chất chống oxy hóa này. Một bữa sáng ngon miệng và tràn đầy năng lượng.",
    imageId: "recipe-3",
  },
  {
    id: 3,
    title: "Salad Quinoa Địa Trung Hải",
    description:
      "Một món salad nhẹ nhàng nhưng đủ no với rau củ tươi, phô mai feta và sốt chanh-thảo mộc.",
    imageId: "recipe-1",
  },
];

export default function RecipesPage() {
  const [isPending, startTransition] = useTransition();
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const handleGetRecommendation = () => {
    startTransition(async () => {
      const result = await recipeRecommendationsBasedOnLoggedFoods({
        dietaryPreferences: "Cân bằng, giàu protein",
        loggedFoods: "Gà, bông cải xanh, gạo, sữa chua",
      });
      setRecommendation(result.recipeRecommendations);
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Công thức nấu ăn lành mạnh"
        description="Khám phá các bữa ăn ngon và bổ dưỡng phù hợp với bạn."
      />
      <div className="mb-8 flex flex-col items-center text-center">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 font-headline text-2xl">
              <ChefHat /> Nhận đề xuất mới từ AI
            </CardTitle>
            <CardDescription>
              Dựa trên sở thích và thực phẩm đã ghi lại, AI của chúng tôi có thể đề xuất món mới để bạn thử.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/50">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recommendation ? (
              <div className="rounded-lg border bg-accent/20 p-4 text-left">
                <p className="text-sm text-accent-foreground/80">{recommendation}</p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleGetRecommendation} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Đề xuất công thức
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {initialRecipes.map((recipe) => {
          const image = PlaceHolderImages.find((p) => p.id === recipe.imageId);
          return (
            <Card key={recipe.id} className="flex flex-col">
              <CardHeader>
                {image && (
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      width={600}
                      height={400}
                      data-ai-hint={image.imageHint}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <CardTitle className="font-headline text-xl">
                  {recipe.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  {recipe.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Xem công thức</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
