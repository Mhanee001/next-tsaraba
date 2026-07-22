import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Next Tsaraba" },
      { name: "description", content: "Weekly and monthly reports: profit, top agents, material trends." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming next: weekly & monthly profit, top-performing agents, raw material usage trends.
        </p>
      </CardContent>
    </Card>
  ),
});
