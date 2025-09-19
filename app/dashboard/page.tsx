"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Copy, Eye } from "lucide-react";

function DashboardInner() {
  const router = useRouter();
  const { state, deleteApplication, duplicateApplication } = useApp();

  function handleNew() {
    router.push(`/app?new=1`);
  }

  function handleView(id: string) {
    router.push(`/app?appId=${id}`);
  }

  const apps = state.applications;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Manage your visa applications
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" /> New Application
        </Button>
      </div>
      <Separator />

      {apps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No applications yet</CardTitle>
            <CardDescription>
              Get started by creating your first application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="size-4" /> New Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Resume, duplicate, or delete applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Visa Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.destination ?? "—"}</TableCell>
                    <TableCell>{a.visaTypeLabel ?? "—"}</TableCell>
                    <TableCell>{a.purpose ?? "—"}</TableCell>
                    <TableCell>
                      {a.dates.from ?? "—"}{" "}
                      {a.dates.to ? `→ ${a.dates.to}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{a.progressPct}%</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(a.id)}
                        className="gap-1"
                      >
                        <Eye className="size-4" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateApplication(a.id)}
                        className="gap-1"
                      >
                        <Copy className="size-4" /> Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteApplication(a.id)}
                        className="gap-1"
                      >
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardInner />;
}
