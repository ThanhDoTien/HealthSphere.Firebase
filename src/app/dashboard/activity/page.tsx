import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will log your physical activities. Feature coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
