"use client";

import * as React from "react";
import type {
  ApplicationMeta,
  ChecklistItem,
  ExtractionResult,
  MappingItem,
  TripSelections,
  UploadMeta,
} from "@/types/types";
export type ChecklistState = Record<string, boolean>;
import {
  MOCK_EXTRACTION,
  MOCK_MAPPING,
  generateChecklist,
  visaLabelFor,
} from "@/lib/mocks";

export interface AppState {
  applications: ApplicationMeta[];
  currentAppId: string | null;
  trip: TripSelections | null;
  checklist: ChecklistItem[];
  checklistState: ChecklistState;
  uploads: UploadMeta[];
  extraction: ExtractionResult;
  mapping: MappingItem[];
  mappingOverrides: Record<string, string | number>;
}

const AppContext = React.createContext<{
  state: AppState;
  createApplication: () => string;
  loadApplication: (id: string) => void;
  deleteApplication: (id: string) => void;
  duplicateApplication: (id: string) => string;
  updateTrip: (next: Partial<TripSelections>) => void;
  toggleChecklistItem: (id: string) => void;
  setUploads: (uploads: UploadMeta[]) => void;
  updateMappingValue: (formField: string, value: string | number) => void;
} | null>(null);

function calcProgress(
  checklist: ChecklistItem[],
  checklistState: ChecklistState
): number {
  if (!checklist.length) return 0;
  const done = checklist.filter((i) => checklistState[i.id] || i.done).length;
  return Math.round((done / checklist.length) * 100);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => ({
    applications: [],
    currentAppId: null,
    trip: null,
    checklist: [],
    checklistState: {},
    uploads: [],
    extraction: MOCK_EXTRACTION,
    mapping: MOCK_MAPPING,
    mappingOverrides: {},
  }));

  // No persistence (backend to be implemented later)

  function createApplication(): string {
    const id = crypto.randomUUID();
    const trip: TripSelections = {
      nationalityCode: "HKG",
      destinationCountryAlpha2: null,
      destination: null,
      purpose: null,
      dates: { from: null, to: null },
      visaTypeLabel: null,
    };
    const appMeta: ApplicationMeta = {
      id,
      destination: null,
      visaTypeLabel: null,
      purpose: null,
      dates: { from: null, to: null },
      progressPct: 0,
    };

    const apps = [...state.applications, appMeta];
    setState((s) => ({ ...s, applications: apps, currentAppId: id, trip }));
    return id;
  }

  function loadApplication(id: string) {
    const trip = state.trip; // No persistence; keep current
    const checklistState = state.checklistState;
    const uploads = state.uploads;
    const mappingOverrides = state.mappingOverrides;
    const visaLabel = trip?.destination ? visaLabelFor(trip.destination) : null;
    const checklist = visaLabel
      ? generateChecklist(visaLabel, trip?.dates ?? { from: null, to: null })
      : [];
    setState((s) => ({
      ...s,
      currentAppId: id,
      trip,
      checklist,
      checklistState,
      uploads,
      mappingOverrides,
    }));
  }

  function deleteApplication(id: string) {
    const apps = state.applications.filter((a) => a.id !== id);
    setState((s) => ({ ...s, applications: apps }));
    if (state.currentAppId === id) {
      setState((s) => ({ ...s, currentAppId: apps[0]?.id ?? null }));
    }
  }

  function duplicateApplication(id: string): string {
    const original = state.applications.find((a) => a.id === id);
    const newId = crypto.randomUUID();
    const copy: ApplicationMeta = {
      ...original!,
      id: newId,
      progressPct: 0,
    };
    const apps = [...state.applications, copy];
    setState((s) => ({ ...s, applications: apps }));
    return newId;
  }

  function updateTrip(next: Partial<TripSelections>) {
    if (!state.currentAppId) return;
    const current = state.trip ?? {
      nationalityCode: "HKG",
      destinationCountryAlpha2: null,
      destination: null,
      purpose: null,
      dates: { from: null, to: null },
      visaTypeLabel: null,
    };
    const merged: TripSelections = { ...current, ...next };
    const visaTypeLabel = visaLabelFor(merged.destination ?? null);
    merged.visaTypeLabel = visaTypeLabel;

    const checklist = visaTypeLabel
      ? generateChecklist(visaTypeLabel, merged.dates)
      : [];
    const apps = state.applications.map((a) =>
      a.id === state.currentAppId
        ? {
            ...a,
            destination: merged.destination,
            visaTypeLabel,
            purpose: merged.purpose,
            dates: merged.dates,
            progressPct: calcProgress(checklist, state.checklistState),
          }
        : a
    );

    setState((s) => ({ ...s, trip: merged, applications: apps, checklist }));
  }

  function toggleChecklistItem(itemId: string) {
    if (!state.currentAppId) return;
    const next = {
      ...state.checklistState,
      [itemId]: !state.checklistState[itemId],
    };
    const apps = state.applications.map((a) =>
      a.id === state.currentAppId
        ? { ...a, progressPct: calcProgress(state.checklist, next) }
        : a
    );
    setState((s) => ({ ...s, checklistState: next, applications: apps }));
  }

  function setUploads(uploads: UploadMeta[]) {
    if (!state.currentAppId) return;
    setState((s) => ({ ...s, uploads }));
  }

  function updateMappingValue(formField: string, value: string | number) {
    if (!state.currentAppId) return;
    const next = { ...state.mappingOverrides, [formField]: value };
    setState((s) => ({ ...s, mappingOverrides: next }));
  }

  const value = React.useMemo(
    () => ({
      state,
      createApplication,
      loadApplication,
      deleteApplication,
      duplicateApplication,
      updateTrip,
      toggleChecklistItem,
      setUploads,
      updateMappingValue,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
