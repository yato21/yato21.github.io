export interface Participant {
  name: string;
  dates: string[]; // ISO Date strings "YYYY-MM-DD"
}

export interface EventData {
  id: string;
  name: string;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;   // ISO "YYYY-MM-DD"
  participants: Record<string, Participant>; // Keyed by UserID
  createdAt: number;
  // Legacy fields
  year?: number;
  month?: number;
}

export interface UserIdentity {
  id: string;
  name: string;
}