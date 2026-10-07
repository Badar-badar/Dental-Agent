import { DateTime, Interval } from "luxon";

/**
 * Compute available slots on one date using the clinic hours and busy intervals.
 */
export function computeFreeSlots({ date, durationMins, busy, clinic, now = DateTime.now() }) {
  const day = DateTime.fromISO(date, { zone: clinic.tz });
  if (!day.isValid) throw new Error(`Invalid date: ${date}. Use YYYY-MM-DD.`);
  if (!clinic.openDays.includes(day.weekday)) return [];

  const open = day.set({ hour: clinic.openHour, minute: 0, second: 0, millisecond: 0 });
  const close = day.set({ hour: clinic.closeHour, minute: 0, second: 0, millisecond: 0 });
  const busyIntervals = busy.map((interval) =>
    Interval.fromDateTimes(DateTime.fromISO(interval.start), DateTime.fromISO(interval.end))
  );

  const slots = [];
  for (let time = open; time.plus({ minutes: durationMins }) <= close; time = time.plus({ minutes: 30 })) {
    if (time < now) continue;
    const slot = Interval.fromDateTimes(time, time.plus({ minutes: durationMins }));
    if (!busyIntervals.some((interval) => interval.overlaps(slot))) {
      slots.push({
        start: time.toISO({ suppressMilliseconds: true }),
        label: time.toFormat("ccc d LLL, h:mm a"),
      });
    }
  }
  return slots;
}

/** Check whether a proposed appointment falls within configured clinic hours. */
export function isWithinClinicHours(startISO, durationMins, clinic) {
  const start = DateTime.fromISO(startISO, { zone: clinic.tz });
  if (!start.isValid) return false;
  const end = start.plus({ minutes: durationMins });
  const open = start.set({ hour: clinic.openHour, minute: 0, second: 0, millisecond: 0 });
  const close = start.set({ hour: clinic.closeHour, minute: 0, second: 0, millisecond: 0 });
  return clinic.openDays.includes(start.weekday) && start >= open && end <= close;
}
