import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { startOfDay, startOfWeek } from "date-fns";

// Single-user app based in Prague. The server (Vercel) runs in UTC, so every
// display and every wall-clock <-> instant conversion must be done explicitly
// in this timezone. This handles CET/CEST (DST) automatically.
export const TZ = "Europe/Prague";

/** Format an instant for display in Prague time. */
export function fmtDate(iso: string | Date, pattern = "d. M. yyyy") {
  return formatInTimeZone(new Date(iso), TZ, pattern);
}
export function fmtTime(iso: string | Date) {
  return formatInTimeZone(new Date(iso), TZ, "HH:mm");
}

/** Values for <input type="date"> / <input type="time"> defaults, in Prague time. */
export function dateInputValue(iso: string | Date) {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd");
}
export function timeInputValue(iso: string | Date) {
  return formatInTimeZone(new Date(iso), TZ, "HH:mm");
}

/** Convert a Prague wall-clock date+time (from form inputs) to a UTC instant. */
export function wallToUtcIso(date: string, time: string) {
  return fromZonedTime(`${date}T${time}`, TZ).toISOString();
}

/** Start of today / this week in Prague, expressed as a UTC instant. */
export function pragueDayStartIso(d: Date = new Date()) {
  return fromZonedTime(startOfDay(toZonedTime(d, TZ)), TZ).toISOString();
}
export function pragueWeekStartIso(d: Date = new Date()) {
  return fromZonedTime(startOfWeek(toZonedTime(d, TZ), { weekStartsOn: 1 }), TZ).toISOString();
}

/** Prague calendar-day key (yyyy-MM-dd) for grouping. */
export function pragueDayKey(iso: string | Date) {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd");
}
