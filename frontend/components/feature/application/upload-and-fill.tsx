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
import { ClipboardCopy, Upload } from "lucide-react";
import { toast } from "sonner";

import { DEMO_EXTRACTION, DEMO_MAPPING } from "@/lib/mocks";

function getDisplayName(key: string): string {
  const displayNames: Record<string, string> = {
    fullName: "Full Name",
    dateOfBirth: "Date of Birth",
    passportNumber: "Passport Number",
    nationality: "Nationality",
    expiry: "Expiry Date",
    address: "Address",
    phoneNumber: "Phone Number",
    email: "Email",
    purposeOfTrip: "Purpose of Trip",
    intendedArrivalDate: "Intended Arrival Date",
    intendedDepartureDate: "Intended Departure Date",
    bankBalanceHKD: "Bank Balance (HKD)"
  };

  return displayNames[key] || key;
}

export function UploadAndFill() {
  const { state, setUploads, setExtraction, setMapping, updateMappingValue } = useApp();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function processUploadedFile(file: File) {
    try {
      // Show processing state
      toast.message('Processing document...', { 
        description: 'Extracting data from uploaded file' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setExtraction(DEMO_EXTRACTION);
      setMapping(DEMO_MAPPING);
      
      toast.success('Document processed successfully!', {
        description: 'Personal information extracted and mapped to form fields'
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process document');
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

  function onCopyMapping() {
    const merged = state.mapping.map((m) => ({
      ...m,
      value: state.mappingOverrides[m.formField] ?? m.value,
    }));
    navigator.clipboard.writeText(
      JSON.stringify(
        { visaType: state.trip?.visaTypeLabel, mappings: merged },
        null,
        2
      )
    );
    toast.success("Mapping JSON copied");
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
    {/* Identity */}
    <div className="rounded-md border p-3 space-y-1 md:col-span-2">
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

    {/* Contact */}
    <div className="rounded-md border p-3 space-y-1 md:col-span-2">
      <div>Address</div>
      <div>{state.extraction.address}</div>
    </div>
    <div className="rounded-md border p-3 space-y-1">
      <div>Phone Number</div>
      <div>{state.extraction.phoneNumber}</div>
    </div>
    <div className="rounded-md border p-3 space-y-1">
      <div>Email</div>
      <div>{state.extraction.email}</div>
    </div>

    {/* Travel */}
    <div className="rounded-md border p-3 space-y-1">
      <div>Purpose of Trip</div>
      <div>{state.extraction.purposeOfTrip}</div>
    </div>
    <div className="rounded-md border p-3 space-y-1">
      <div>Intended Arrival Date</div>
      <div>{state.extraction.intendedArrivalDate}</div>
    </div>
    <div className="rounded-md border p-3 space-y-1">
      <div>Intended Departure Date</div>
      <div>{state.extraction.intendedDepartureDate}</div>
    </div>

    {/* Financial */}
    <div className="rounded-md border p-3 space-y-1 md:col-span-2">
      <div>Bank Balance (HKD)</div>
      <div>{state.extraction.bankBalanceHKD.toLocaleString()}</div>
    </div>
  </div>
</div>

      <div>
        <div className="font-medium mb-2 flex items-center justify-between">
          <span>Edit Information</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.mapping.map((m) => (
              <TableRow key={m.formField} className="transition-colors">
                <TableCell>{getDisplayName(m.extractedKey)}</TableCell>
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
