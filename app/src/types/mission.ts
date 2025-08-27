export interface Mission {
  _id: string;
  // Display title (may contain legacy combined title)
  title: string;
  // Structured subtitle when available
  subtitle?: string | null;
  // Full description (optional)
  description?: string | null;
  // Stored as ISO string from server or Date
  date?: string | Date;
  // isRare/twist/tags removed
  imageUrl?: string | null;
}

export type MaybeMission = Mission | null | undefined;
