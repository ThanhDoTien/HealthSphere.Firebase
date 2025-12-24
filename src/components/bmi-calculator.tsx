"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BmiCalculator() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState("");

  const calculateBmi = () => {
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmiValue = weight / (heightInMeters * heightInMeters);
      setBmi(bmiValue);

      if (bmiValue < 18.5) {
        setBmiCategory("Underweight");
      } else if (bmiValue < 25) {
        setBmiCategory("Normal weight");
      } else if (bmiValue < 30) {
        setBmiCategory("Overweight");
      } else {
        setBmiCategory("Obese");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>BMI Calculator</CardTitle>
        <CardDescription>
          Calculate your Body Mass Index (BMI) to understand your weight status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="e.g. 70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              placeholder="e.g. 175"
            />
          </div>
        </div>
        {bmi !== null && (
          <div className="rounded-lg border bg-accent/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Your BMI is</p>
            <p className="text-4xl font-bold text-accent-foreground">
              {bmi.toFixed(1)}
            </p>
            <p className="font-medium text-accent-foreground">{bmiCategory}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={calculateBmi}>Calculate BMI</Button>
      </CardFooter>
    </Card>
  );
}
