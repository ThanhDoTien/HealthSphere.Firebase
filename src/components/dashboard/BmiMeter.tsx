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
    color: '#60a5fa', // Equivalent to bg-blue-400
    textColor: 'text-blue-400',
    max: 18.5,
  },
  NORMAL: {
    labelKey: 'dashboard.bmi.normal',
    color: '#22c55e', // Equivalent to bg-green-500
    textColor: 'text-green-500',
    max: 24.9,
  },
  OVERWEIGHT: {
    labelKey: 'dashboard.bmi.overweight',
    color: '#facc15', // Equivalent to bg-yellow-400
    textColor: 'text-yellow-400',
    max: 29.9,
  },
  OBESE: {
    labelKey: 'dashboard.bmi.obese',
    color: '#f97316', // Equivalent to bg-orange-500
    textColor: 'text-orange-500',
    max: 39.9,
  },
  SEVERELY_OBESE: {
    labelKey: 'dashboard.bmi.severelyObese',
    color: '#ef4444', // Equivalent to bg-red-500
    textColor: 'text-red-500',
    max: Infinity,
  },
};

const getBmiStatus = (bmi: number) => {
  if (bmi < 18.5) return BMI_CATEGORIES.UNDERWEIGHT;
  if (bmi < 25) return BMI_CATEGORIES.NORMAL;
  if (bmi < 30) return BMI_CATEGORIES.OVERWEIGHT;
  if (bmi < 40) return BMI_CATEGORIES.OBESE;
  return BMI_CATEGORIES.SEVERELY_OBESE;
};


export default function BmiMeter({ height, weight }: BmiMeterProps) {
  const { t } = useTranslation();

  const { bmi, status } = useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return { bmi: 0, status: null };
    }
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    const bmiStatus = getBmiStatus(bmiValue);

    return {
      bmi: bmiValue,
      status: bmiStatus,
    };
  }, [height, weight]);

  // SVG Gauge constants
  const minBmi = 10;
  const maxBmi = 45;
  const radius = 80;
  const strokeWidth = 20;
  const centerX = 120;
  const centerY = 100;

  const mapBmiToAngle = (bmiValue: number) => {
    const clampedBmi = Math.max(minBmi, Math.min(bmiValue, maxBmi));
    // Map BMI range (10-45) to angle range (-90 to 90 degrees) for rotation
    const percentage = (clampedBmi - minBmi) / (maxBmi - minBmi);
    return percentage * 180 - 90;
  };
  
  const bmiRotation = mapBmiToAngle(bmi);
  
  const segments = [
    { category: BMI_CATEGORIES.UNDERWEIGHT, min: 10, max: 18.5 },
    { category: BMI_CATEGORIES.NORMAL, min: 18.5, max: 25 },
    { category: BMI_CATEGORIES.OVERWEIGHT, min: 25, max: 30 },
    { category: BMI_CATEGORIES.OBESE, min: 30, max: 40 },
    { category: BMI_CATEGORIES.SEVERELY_OBESE, min: 40, max: 45 },
  ];

  const polarToCartesian = (angle: number) => {
    const angleRad = ((angle - 90) * Math.PI) / 180.0; // Adjust for SVG coordinate system (0 is up)
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    // The sweep flag is 1 for clockwise
    const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    return d;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.bmi.title')}</CardTitle>
        <CardDescription>{t('dashboard.bmi.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!status ? (
          <div className="text-center text-muted-foreground p-8">
            {t('dashboard.bmi.noData')}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-[240px] h-[120px]">
              <svg width="240" height="120" viewBox="0 0 240 120" className="absolute top-0 left-0">
                <g strokeLinecap="round">
                  {segments.map((segment) => {
                    const startAngle = mapBmiToAngle(segment.min);
                    const endAngle = mapBmiToAngle(segment.max);
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
                    <path d={`M ${centerX} ${centerY - 5} L ${centerX} ${centerY - radius - 10}`} stroke="hsl(var(--foreground))" strokeWidth="2" />
                    <circle cx={centerX} cy={centerY} r="4" fill="hsl(var(--foreground))" />
                </g>
              </svg>

              {/* BMI Value and Status Text */}
              <div className="absolute bottom-[-10px] w-full text-center">
                <div className="text-4xl font-bold tracking-tighter">
                  {bmi.toFixed(1)}
                </div>
                <div className={`font-semibold ${status.textColor}`}>
                  {t(status.labelKey)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
