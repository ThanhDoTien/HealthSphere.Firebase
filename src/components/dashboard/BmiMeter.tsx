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
    bgColor: 'bg-blue-400',
    textColor: 'text-blue-400',
    max: 18.5,
  },
  NORMAL: {
    labelKey: 'dashboard.bmi.normal',
    bgColor: 'bg-green-500',
    textColor: 'text-green-500',
    max: 24.9,
  },
  OVERWEIGHT: {
    labelKey: 'dashboard.bmi.overweight',
    bgColor: 'bg-yellow-400',
    textColor: 'text-yellow-400',
    max: 29.9,
  },
  OBESE: {
    labelKey: 'dashboard.bmi.obese',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-500',
    max: 39.9,
  },
  SEVERELY_OBESE: {
    labelKey: 'dashboard.bmi.severelyObese',
    bgColor: 'bg-red-500',
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

// Maps a BMI value (10-45) to a rotation angle (-90 to 90)
const calculateRotation = (bmi: number) => {
  const minBmi = 10;
  const maxBmi = 45;
  const clampedBmi = Math.max(minBmi, Math.min(bmi, maxBmi));
  const percentage = (clampedBmi - minBmi) / (maxBmi - minBmi);
  return percentage * 180 - 90;
};

export default function BmiMeter({ height, weight }: BmiMeterProps) {
  const { t } = useTranslation();

  const { bmi, status, rotation } = useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return { bmi: 0, status: null, rotation: -90 };
    }
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    const bmiStatus = getBmiStatus(bmiValue);
    const bmiRotation = calculateRotation(bmiValue);

    return {
      bmi: bmiValue,
      status: bmiStatus,
      rotation: bmiRotation,
    };
  }, [height, weight]);

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
            {/* BMI Gauge */}
            <div className="relative h-[120px] w-[240px] overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 top-0 flex">
                <div className={`h-full w-1/5 ${BMI_CATEGORIES.UNDERWEIGHT.bgColor} rounded-tl-full`}></div>
                <div className={`h-full w-1/5 ${BMI_CATEGORIES.NORMAL.bgColor}`}></div>
                <div className={`h-full w-1/5 ${BMI_CATEGORIES.OVERWEIGHT.bgColor}`}></div>
                <div className={`h-full w-1/5 ${BMI_CATEGORIES.OBESE.bgColor}`}></div>
                <div className={`h-full w-1/5 ${BMI_CATEGORIES.SEVERELY_OBESE.bgColor} rounded-tr-full`}></div>
              </div>
              {/* White overlay to create the arc */}
              <div className="absolute bottom-[-60px] left-1/2 h-[180px] w-[180px] -translate-x-1/2 rounded-full bg-card"></div>

              {/* Needle */}
              <div
                className="absolute bottom-0 left-1/2 h-24 w-1 origin-bottom transition-transform duration-700"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
              >
                <div className="h-full w-full rounded-t-full bg-foreground"></div>
              </div>
              {/* Needle pivot */}
              <div className="absolute bottom-[-10px] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-foreground bg-card"></div>
            </div>

            {/* BMI Value and Status */}
            <div className="text-center">
              <div className="text-4xl font-bold tracking-tighter">
                {bmi.toFixed(1)}
              </div>
              <div className={`font-semibold ${status.textColor}`}>
                {t(status.labelKey)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
