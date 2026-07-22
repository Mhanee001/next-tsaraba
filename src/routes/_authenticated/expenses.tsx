import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Next Tsaraba" },
      { name: "description", content: "Daily expenses by category." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming next: log fuel, maintenance, food, wages and misc expenses.
        </p>
      </CardContent>
    </Card>
  ),
});
