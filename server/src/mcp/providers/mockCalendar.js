const appointments = [];

/** Return mock-calendar busy intervals that overlap the requested time range. */
export async function getBusy(timeMin, timeMax) {
  return appointments
    .filter((event) => event.start < timeMax && event.end > timeMin)
    .map(({ start, end }) => ({ start, end }));
}

/** Add a mock appointment to this process's in-memory calendar. */
export async function insertEvent({ summary, start, end }) {
  appointments.push({ start, end, summary });
  return { id: `mock-${appointments.length}`, link: "(mock calendar - no real event created)" };
}
