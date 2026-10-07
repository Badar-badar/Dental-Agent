import { DateTime, Interval } from "luxon";

/**
 * Free slots on a given day, on a 30-minute grid, inside clinic hours.
 * `busy` is an array of { start, end } ISO strings.
 */
export function computeFreeSlots({ date, durationMins, busy, clinic, now = DateTime.now() }) {
  const day = DateTime.fromISO(date, { zone: clinic.tz });
  if (!day.isValid) throw new Error(`Invalid date: ${date}. Use YYYY-MM-DD.`);
  if (!clinic.openDays.includes(day.weekday)) return [];

  const open = day.set({ hour: clinic.openHour, minute: 0, second: 0, millisecond: 0 });
  const close = day.set({ hour: clinic.closeHour, minute: 0, second: 0, millisecond: 0 });
  const busyIntervals = busy.map((b) =>
    Interval.fromDateTimes(DateTime.fromISO(b.start), DateTime.fromISO(b.end))
  );

  const slots = [];
  for (let t = open; t.plus({ minutes: durationMins }) <= close; t = t.plus({ minutes: 30 })) {
    if (t < now) continue;
    const slot = Interval.fromDateTimes(t, t.plus({ minutes: durationMins }));
    if (!busyIntervals.some((b) => b.overlaps(slot))) {
      slots.push({ start: t.toISO({ suppressMilliseconds: true }), label: t.toFormat("ccc d LLL, h:mm a") });
    }
  }
  return slots;
}

export function isWithinClinicHours(startISO, durationMins, clinic) {
  const start = DateTime.fromISO(startISO, { zone: clinic.tz });
  if (!start.isValid) return false;
  const end = start.plus({ minutes: durationMins });
  const open = start.set({ hour: clinic.openHour, minute: 0, second: 0, millisecond: 0 });
  const close = start.set({ hour: clinic.closeHour, minute: 0, second: 0, millisecond: 0 });
  return clinic.openDays.includes(start.weekday) && start >= open && end <= close;
}
