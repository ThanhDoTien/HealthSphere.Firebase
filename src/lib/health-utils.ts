/**
 * Tính toán BMR (Basal Metabolic Rate) theo công thức Harris-Benedict cải tiến (Roza and Shizgal, 1984).
 */
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender.toLowerCase() === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

/**
 * Tính toán TDEE (Total Daily Energy Expenditure) dựa trên BMR và cường độ vận động.
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: { [key: string]: number } = {
    sedentary: 1.2,      // Ít vận động
    light: 1.375,        // Vận động nhẹ
    moderate: 1.55,      // Vận động vừa
    active: 1.725,       // Vận động mạnh
    extra: 1.9           // Vận động cực mạnh
  };

  const multiplier = multipliers[activityLevel] || 1.2;
  return bmr * multiplier;
}
