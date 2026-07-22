import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reconciliation")({
  head: () => ({
    meta: [
      { title: "Cash reconciliation — Next Tsaraba" },
      { name: "description", content: "Daily cash reconciliation with variance warnings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Cash reconciliation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming next: expected vs actual cash, auto-computed variance warnings.
        </p>
      </CardContent>
    </Card>
  ),
});
