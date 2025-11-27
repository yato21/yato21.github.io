export interface Participant {
  name: string;
  dates: string[]; // ISO Date strings "YYYY-MM-DD"
}

export interface EventData {
  id: string;
  name: string;
  month: number; // 0-11
  year: number;
  participants: Record<string, Participant>; // Keyed by UserID
  createdAt: number;
}

export interface UserIdentity {
  id: string;
  name: string;
}