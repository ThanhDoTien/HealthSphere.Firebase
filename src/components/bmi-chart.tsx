
"use client";

import { cn } from "@/lib/utils";

type BmiCategory = {
  label: string;
  min: number;
  max: number;
  color: string;
};

const categories: BmiCategory[] = [
  { label: "Thiếu cân", min: 0, max: 18.5, color: "bg-blue-400" },
  { label: "Bình thường", min: 18.5, max: 25, color: "bg-green-500" },
  { label: "Thừa cân", min: 25, max: 30, color: "bg-yellow-500" },
  { label: "Béo phì", min: 30, max: 40, color: "bg-orange-500" },
  { label: "Béo phì độ III", min: 40, max: Infinity, color: "bg-red-500" },
];

const getBmiCategory = (bmi: number): BmiCategory => {
  return categories.find((c) => bmi >= c.min && bmi < c.max) || categories[categories.length - 1];
};

const getIndicatorPosition = (bmi: number): number => {
  const minBmi = 15;
  const maxBmi = 40;
  const clampedBmi = Math.max(minBmi, Math.min(bmi, maxBmi));
  // Map BMI range to percentage
  return ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;
};

export function BmiChart({ bmi }: { bmi: number }) {
  const category = getBmiCategory(bmi);
  const position = getIndicatorPosition(bmi);
  
  const categoryWidths = {
      underweight: ((18.5 - 15) / 25) * 100, // 3.5 points
      normal: ((25 - 18.5) / 25) * 100, // 6.5 points
      overweight: ((30 - 25) / 25) * 100, // 5 points
      obese1: ((40 - 30) / 25) * 100, // 10 points
  }

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg p-4">
        <div className="mb-4">
            <h2 className="text-5xl font-bold tracking-tighter">{bmi.toFixed(1)}</h2>
            <p className={cn("text-lg font-semibold", category.color.replace('bg-', 'text-'))}>
            {category.label}
            </p>
            <p className="text-sm text-muted-foreground">Chỉ số khối cơ thể (BMI)</p>
        </div>

      <div className="w-full">
        {/* Indicator Arrow */}
        <div className="relative h-4 w-full" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
          <div className="absolute bottom-0 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-foreground" style={{ left: '50%', transform: 'translateX(-50%)' }} />
        </div>
        
        {/* Horizontal Bar */}
        <div className="flex h-4 w-full rounded-full overflow-hidden">
          <div className={categories[0].color} style={{ width: `${categoryWidths.underweight}%` }}></div>
          <div className={categories[1].color} style={{ width: `${categoryWidths.normal}%` }}></div>
          <div className={categories[2].color} style={{ width: `${categoryWidths.overweight}%` }}></div>
          <div className={cn(categories[3].color, "flex-grow")}></div>
        </div>

        {/* Labels */}
        <div className="relative mt-2 flex w-full justify-between text-xs text-muted-foreground">
           <span style={{ position: 'absolute', left: '0%'}}>15</span>
           <span style={{ position: 'absolute', left: `${categoryWidths.underweight}%`, transform: 'translateX(-50%)' }}>18.5</span>
           <span style={{ position: 'absolute', left: `${categoryWidths.underweight + categoryWidths.normal}%`, transform: 'translateX(-50%)' }}>25</span>
           <span style={{ position: 'absolute', left: `${categoryWidths.underweight + categoryWidths.normal + categoryWidths.overweight}%`, transform: 'translateX(-50%)' }}>30</span>
           <span style={{ position: 'absolute', right: '0%'}}>40+</span>
        </div>
      </div>
    </div>
  );
}
