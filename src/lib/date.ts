const KOREAN_DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;

export function toDateOnly(dateTime: string): string {
  return dateTime.split("T")[0];
}

export function formatKoreanDate(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString("ko-KR", KOREAN_DATE_FORMAT_OPTIONS);
}
