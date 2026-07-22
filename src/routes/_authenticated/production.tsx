import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory } from "lucide-react";

export const Route = createFileRoute("/_authenticated/production")({
  head: () => ({
    meta: [
      { title: "Production — Next Tsaraba" },
      { name: "description", content: "Daily production logs by shift, damages and carry-over stock." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Factory className="h-5 w-5" /> Production</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming next: morning and evening shift logs, damages, and carry-over stock.
        </p>
      </CardContent>
    </Card>
  ),
});
