import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will provide personalized recipe and exercise suggestions. Feature coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
