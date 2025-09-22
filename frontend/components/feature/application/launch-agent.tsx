"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LaunchAgent() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-6 min-h-[420px] flex items-center justify-center text-muted-foreground">
        Agent Runner — placeholder
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Running agent…</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>Opening form…</div>
            <div>Filling section A…</div>
            <div>Reviewing…</div>
            <div className="font-medium text-green-600">Complete</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
