import { google } from "googleapis";

/**
 * Calendar adapter. Real Google Calendar, or an in-memory fake (MOCK_CALENDAR=true)
 * so the whole booking flow can be tested before Google OAuth is set up.
 */
const mock = process.env.MOCK_CALENDAR === "true";
const CAL_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const memory = [];

let gcal;
function client() {
  if (gcal) return gcal;
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  gcal = google.calendar({ version: "v3", auth });
  return gcal;
}

export async function getBusy(timeMin, timeMax, timeZone) {
  if (mock) {
    return memory.filter((e) => e.start < timeMax && e.end > timeMin).map(({ start, end }) => ({ start, end }));
  }
  const { data } = await client().freebusy.query({
    requestBody: { timeMin, timeMax, timeZone, items: [{ id: CAL_ID }] },
  });
  return data.calendars[CAL_ID].busy || [];
}

export async function insertEvent({ summary, description, start, end, timeZone }) {
  if (mock) {
    memory.push({ start, end, summary });
    return { id: `mock-${memory.length}`, link: "(mock calendar - no real event created)" };
  }
  const { data } = await client().events.insert({
    calendarId: CAL_ID,
    requestBody: { summary, description, start: { dateTime: start, timeZone }, end: { dateTime: end, timeZone } },
  });
  return { id: data.id, link: data.htmlLink };
}
