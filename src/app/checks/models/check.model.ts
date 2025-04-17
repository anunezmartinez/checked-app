// src/app/checks/models/check.model.ts
export interface Check {
  _id: string;
  name: string;
  description: string;
  periodicity: number; // in minutes
  last_checked: string | null; // ISO date string
  created_at: string; // ISO date string
  notification_enabled: boolean;
  user_id: string;
  history?: string[]; // Array of ISO date strings for check history
}
