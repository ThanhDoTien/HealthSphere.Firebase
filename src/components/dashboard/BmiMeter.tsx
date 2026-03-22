'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/context/LanguageContext';

interface BmiMeterProps {
  height: number; // in cm
  weight: number; // in kg
}

const BMI_CATEGORIES = {
  UNDERWEIGHT: {
    labelKey: 'dashboard.bmi.underweight',
    adviceKey: 'dashboard.bmi.advice.underweight',
    color: '#60a5fa',
    textColor: 'text-blue-400',
    max: 18.5,
  },
  NORMAL: {
    labelKey: 'dashboard.bmi.normal',
    adviceKey: 'dashboard.bmi.advice.normal',
    color: '#22c55e',
    textColor: 'text-green-500',
    max: 24.9,
  },
  OVERWEIGHT: {
    labelKey: 'dashboard.bmi.overweight',
    adviceKey: 'dashboard.bmi.advice.overweight',
    color: '#facc15',
    textColor: 'text-yellow-400',
    max: 29.9,
  },
  OBESE: {
    labelKey: 'dashboard.bmi.obese',
    adviceKey: 'dashboard.bmi.advice.obese',
    color: '#f97316',
    textColor: 'text-orange-500',
    max: 34.9,
  },
  SEVERELY_OBESE: {
    labelKey: 'dashboard.bmi.severelyObese',
    adviceKey: 'dashboard.bmi.advice.severelyObese',
    color: '#ef4444',
    textColor: 'text-red-500',
    max: Infinity,
  },
};

const getBmiStatus = (bmi: number) => {
  if (bmi < 18.5) return BMI_CATEGORIES.UNDERWEIGHT;
  if (bmi < 25) return BMI_CATEGORIES.NORMAL;
  if (bmi < 30) return BMI_CATEGORIES.OVERWEIGHT;
  if (bmi < 35) return BMI_CATEGORIES.OBESE;
  return BMI_CATEGORIES.SEVERELY_OBESE;
};

export default function BmiMeter({ height, weight }: BmiMeterProps) {
  const { t } = useTranslation();

  const { bmi, status, targetWeight } = useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return { bmi: 0, status: null, targetWeight: 0 };
    }
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    const bmiStatus = getBmiStatus(bmiValue);
    const idealWeight = Math.round(22 * heightInMeters * heightInMeters * 10) / 10;

    return {
      bmi: bmiValue,
      status: bmiStatus,
      targetWeight: idealWeight,
    };
  }, [height, weight]);

  // SVG Gauge constants (compact version)
  const minBmi = 15;
  const maxBmi = 40;
  const radius = 70;
  const strokeWidth = 16;
  const centerX = 120;
  const centerY = 90;

  const mapBmiToAngle = (bmiValue: number) => {
    const clampedBmi = Math.max(minBmi, Math.min(bmiValue, maxBmi));
    const percentage = (clampedBmi - minBmi) / (maxBmi - minBmi);
    return percentage * 180 - 90;
  };

  const bmiRotation = mapBmiToAngle(bmi);

  const segments = [
    { category: BMI_CATEGORIES.UNDERWEIGHT },
    { category: BMI_CATEGORIES.NORMAL },
    { category: BMI_CATEGORIES.OVERWEIGHT },
    { category: BMI_CATEGORIES.OBESE },
    { category: BMI_CATEGORIES.SEVERELY_OBESE },
  ];

  const segmentAngle = 180 / segments.length;

  const polarToCartesian = (angle: number) => {
    const angleRad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t('dashboard.bmi.title')}</CardTitle>
        <CardDescription className="text-xs">{t('dashboard.bmi.description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {!status ? (
          <div className="text-center text-muted-foreground py-4 text-xs">
            {t('dashboard.bmi.noData')}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-[200px] h-[100px]">
              <svg width="200" height="100" viewBox="0 20 240 100">
                <g strokeLinecap="round">
                  {segments.map((segment, index) => {
                    const startAngle = -90 + index * segmentAngle;
                    const endAngle = startAngle + segmentAngle;

                    return (
                      <path
                        key={segment.category.labelKey}
                        d={describeArc(startAngle, endAngle)}
                        fill="none"
                        stroke={segment.category.color}
                        strokeWidth={strokeWidth}
                      />
                    );
                  })}
                </g>

                {/* Needle */}
                <g transform={`rotate(${bmiRotation}, ${centerX}, ${centerY})`}>
                  <path
                    d={`M ${centerX - 3} ${centerY} L ${centerX} ${centerY - radius - 4} L ${centerX + 3} ${centerY} Z`}
                    fill="hsl(var(--foreground))"
                  />
                  <circle cx={centerX} cy={centerY} r="4" fill="hsl(var(--foreground))" />
                </g>
              </svg>
            </div>

            <div className="text-center -mt-2 space-y-1">
              <div className="text-2xl font-bold tracking-tighter">
                BMI: {bmi.toFixed(1)}
              </div>
              <div className={`text-sm font-semibold ${status.textColor}`}>
                {t(status.labelKey)}
              </div>
              <p className="text-xs leading-tight text-muted-foreground italic mt-1">
                <span className="font-bold not-italic">Tips: </span>
                {t(status.adviceKey)}
              </p>
            </div>
            {targetWeight > 0 && (
              <div className="mt-4 pt-3 border-t w-full flex flex-col items-center gap-1 text-sm">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-muted-foreground">Cân nặng lý tưởng (BMI=22):</span>
                  <span className="font-bold text-primary text-base">{targetWeight} kg</span>
                </div>
                <span className="text-[10px] text-muted-foreground italic text-center px-2">
                  *Tham khảo theo chuẩn y tế. Không áp dụng cho vận động viên, người tập thể hình hoặc có nhu cầu đặc thù.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
