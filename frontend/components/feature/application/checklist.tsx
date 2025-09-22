"use client";

import * as React from "react";
import { useApp } from "@/context/app-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export function Checklist() {
  const { state, toggleChecklistItem } = useApp();
  const [filter, setFilter] = React.useState<
    "All" | "Required" | "Recommended" | "Done"
  >("All");
  const [sortBySoonest, setSortBySoonest] = React.useState(true);

  let items = state.checklist;
  if (filter === "Required") items = items.filter((i) => i.category === "Required");
  if (filter === "Recommended") items = items.filter((i) => i.category === "Recommended");
  if (filter === "Done") items = items.filter((i) => state.checklistState[i.id]);
  if (sortBySoonest) items = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const doneCount = state.checklist.filter((i) => state.checklistState[i.id]).length;
  const reqTotal = state.checklist.filter((i) => i.category === "Required").length;
  const reqDone = state.checklist.filter((i) => i.category === "Required" && state.checklistState[i.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as "All" | "Required" | "Recommended" | "Done")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Required">Required</SelectItem>
            <SelectItem value="Recommended">Recommended</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={() => setSortBySoonest((s) => !s)}>
          <Filter className="size-4" /> {sortBySoonest ? "Soonest first" : "Original order"}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {doneCount}/{state.checklist.length} complete · Required {reqDone}/{reqTotal}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox checked={!!state.checklistState[i.id]} onCheckedChange={() => toggleChecklistItem(i.id)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{i.title}</div>
                <Badge variant={i.category === "Required" ? "default" : "secondary"}>{i.category}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Due {i.dueDate}</span>
              </div>
              {i.description ? <div className="text-sm text-muted-foreground">{i.description}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
