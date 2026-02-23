import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CaloriesPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie Intake</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will track your meals and calorie consumption. Feature coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
