"use client";

import type {
  ApplicationMeta,
  DateRange,
  TripSelections,
  UploadMeta,
} from "@/types";

const ROOT = "tourism";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Applications list
const APPS_KEY = `${ROOT}.applications`;
const CURR_KEY = `${ROOT}.currentAppId`;

export function getApplications(): ApplicationMeta[] {
  return readJSON<ApplicationMeta[]>(APPS_KEY, []);
}

export function saveApplications(apps: ApplicationMeta[]) {
  writeJSON(APPS_KEY, apps);
}

export function getCurrentAppId(): string | null {
  return readJSON<string | null>(CURR_KEY, null);
}

export function setCurrentAppId(id: string) {
  writeJSON(CURR_KEY, id);
}

// Per-app keys
function tripKey(id: string) {
  return `${ROOT}.${id}.trip.selections`;
}

function checklistKey(id: string) {
  return `${ROOT}.${id}.checklist.state`;
}

function uploadsKey(id: string) {
  return `${ROOT}.${id}.uploads.meta`;
}

function mappingOverridesKey(id: string) {
  return `${ROOT}.${id}.mapping.overrides`;
}

export type ChecklistState = Record<string, boolean>;

export function getTripSelections(appId: string): TripSelections | null {
  return readJSON<TripSelections | null>(tripKey(appId), null);
}

export function saveTripSelections(appId: string, sel: TripSelections) {
  writeJSON(tripKey(appId), sel);
}

export function getChecklistState(appId: string): ChecklistState {
  return readJSON<ChecklistState>(checklistKey(appId), {});
}

export function saveChecklistState(appId: string, state: ChecklistState) {
  writeJSON(checklistKey(appId), state);
}

export function getUploadsMeta(appId: string): UploadMeta[] {
  return readJSON<UploadMeta[]>(uploadsKey(appId), []);
}

export function saveUploadsMeta(appId: string, uploads: UploadMeta[]) {
  writeJSON(uploadsKey(appId), uploads);
}

export function getMappingOverrides(
  appId: string
): Record<string, string | number> {
  return readJSON<Record<string, string | number>>(
    mappingOverridesKey(appId),
    {}
  );
}

export function saveMappingOverrides(
  appId: string,
  overrides: Record<string, string | number>
) {
  writeJSON(mappingOverridesKey(appId), overrides);
}
