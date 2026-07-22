import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/materials")({
  head: () => ({
    meta: [
      { title: "Raw materials — Next Tsaraba" },
      { name: "description", content: "Raw materials inventory and low-stock warnings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Raw materials</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming next: film, packaging and chemical inventory with low-stock warnings.
        </p>
      </CardContent>
    </Card>
  ),
});
