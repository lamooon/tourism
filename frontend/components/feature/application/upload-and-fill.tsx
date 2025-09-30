"use client";

import * as React from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { DEMO_EXTRACTION, DEMO_MAPPING } from "@/lib/mocks";

export function UploadAndFill() {
  const { state, setUploads, setExtraction, setMapping, updateMappingValue } =
    useApp();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function processUploadedFile(file: File) {
    try {
      // Show processing state
      toast.message("Processing document...", {
        description: "Extracting data from uploaded file",
      });

      // Simulate processing delay for realistic demo experience
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Always use hardcoded Hong Kong demo data regardless of uploaded file
      setExtraction(DEMO_EXTRACTION);
      setMapping(DEMO_MAPPING);

      toast.success("Document processed successfully!", {
        description: "Personal information extracted and mapped to form fields",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to process document");
    }
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted = ["application/pdf", "image/jpeg", "image/png"];
    const next: typeof state.uploads = [];
    const filesToProcess: File[] = [];

    for (const f of Array.from(files)) {
      const tooBig = f.size > 10 * 1024 * 1024;
      const wrongType = !accepted.includes(f.type);
      if (wrongType || tooBig) {
        toast.error(
          wrongType
            ? `Unsupported type: ${f.type}`
            : `File too large: ${Math.round(f.size / (1024 * 1024))} MB`
        );
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        filename: f.name,
        size: f.size,
        mimeType: f.type,
        status: "Uploaded",
      });
      filesToProcess.push(f);
    }

    if (next.length) {
      setUploads([...(state.uploads ?? []), ...next]);

      // Process the first uploaded file for OCR
      if (filesToProcess.length > 0) {
        processUploadedFile(filesToProcess[0]);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-md border border-dashed p-6 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        role="region"
        aria-label="File upload dropzone"
      >
        <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
        <div className="font-medium">
          Drag and drop files, or click to upload
        </div>
        <div className="text-sm text-muted-foreground">
          PDF, JPG, PNG up to 10 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {state.uploads.length > 0 && (
        <div className="space-y-2">
          {state.uploads.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {u.mimeType.split("/")[1].toUpperCase()}
                </Badge>
                <div>
                  <div className="font-medium">{u.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(u.size / 1024)} KB · {u.status}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setUploads(state.uploads.filter((x) => x.id !== u.id))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="font-medium mb-2">Extraction Preview</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3 space-y-1">
            <div>MRZ</div>
            <div className="font-mono text-xs whitespace-pre-wrap">
              {state.extraction.mrz}
            </div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Full Name</div>
            <div>{state.extraction.fullName}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Date of Birth</div>
            <div>{state.extraction.dateOfBirth}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Passport Number</div>
            <div>{state.extraction.passportNumber}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Nationality</div>
            <div>{state.extraction.nationality}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Expiry</div>
            <div>{state.extraction.expiry}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1 md:col-span-2">
            <div>Address</div>
            <div>{state.extraction.address}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1 md:col-span-2">
            <div>Bank Balance (HKD)</div>
            <div>{state.extraction.bankBalanceHKD.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium mb-2 flex items-center justify-between">
          <span>Mapping</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Extracted Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Mapped Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.mapping.map((m) => (
              <TableRow key={m.formField} className="transition-colors">
                <TableCell>{m.extractedKey}</TableCell>
                <TableCell>
                  {String(state.extraction[m.extractedKey])}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {m.formField}
                </TableCell>
                <TableCell>
                  <Input
                    value={String(
                      state.mappingOverrides[m.formField] ?? m.value
                    )}
                    onChange={(e) =>
                      updateMappingValue(m.formField, e.target.value)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
