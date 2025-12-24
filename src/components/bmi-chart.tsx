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
  { label: "Béo phì độ III", min: 40, max: 50, color: "bg-red-500" },
];

const getBmiCategory = (bmi: number): BmiCategory => {
  return categories.find((c) => bmi >= c.min && bmi < c.max) || categories[categories.length - 1];
};

const getNeedleRotation = (bmi: number): number => {
  const minBmi = 10;
  const maxBmi = 45;
  const clampedBmi = Math.max(minBmi, Math.min(bmi, maxBmi));
  // Map BMI range (10-45) to angle range (-90 to 90 degrees)
  return ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 180 - 90;
};

export function BmiChart({ bmi }: { bmi: number }) {
  const category = getBmiCategory(bmi);
  const rotation = getNeedleRotation(bmi);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-md p-4">
      <div className="relative w-full aspect-[2/1] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Gauge Background Arcs */}
          <div className="absolute w-full h-[200%] rounded-full left-0 top-0 border-box transform-gpu" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' }}>
            <div className={cn("absolute w-full h-full rounded-full", categories[0].color)} style={{ clipPath: 'polygon(0% 0%, 20% 0%, 20% 100%, 0% 100%)' }}></div>
            <div className={cn("absolute w-full h-full rounded-full", categories[1].color)} style={{ clipPath: 'polygon(20% 0%, 40% 0%, 40% 100%, 20% 100%)' }}></div>
            <div className={cn("absolute w-full h-full rounded-full", categories[2].color)} style={{ clipPath: 'polygon(40% 0%, 60% 0%, 60% 100%, 40% 100%)' }}></div>
            <div className={cn("absolute w-full h-full rounded-full", categories[3].color)} style={{ clipPath: 'polygon(60% 0%, 80% 0%, 80% 100%, 60% 100%)' }}></div>
            <div className={cn("absolute w-full h-full rounded-full", categories[4].color)} style={{ clipPath: 'polygon(80% 0%, 100% 0%, 100% 100%, 80% 100%)' }}></div>
          </div>

          {/* Inner white arc */}
          <div className="absolute w-[80%] h-[160%] bg-card rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-box">
             <div className="absolute w-full h-[50%] top-0 left-0 bg-card" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}></div>
          </div>
          
           {/* Labels */}
          <div className="absolute inset-0 w-full h-full">
            {categories.map((cat, i) => {
                 const angle = -72 + i * 36;
                 return (
                    <div key={cat.label} className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angle}deg) translate(80px) rotate(${-angle}deg)` }}>
                        <span className="text-xs font-medium text-foreground/80">{cat.label}</span>
                    </div>
                 )
            })}
          </div>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-1/2 bg-gray-800 dark:bg-gray-200 origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-800 dark:bg-gray-200"></div>
          </div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-700 dark:bg-gray-300 border-4 border-card"></div>

        </div>
      </div>
      <div className="mt-[-2rem] z-10">
        <h2 className="text-5xl font-bold tracking-tighter">{bmi.toFixed(1)}</h2>
        <p className="text-lg font-semibold" style={{ color: category.color.replace('bg-', 'text-') }}>
          {category.label}
        </p>
        <p className="text-sm text-muted-foreground">Chỉ số khối cơ thể (BMI)</p>
      </div>
    </div>
  );
}
