import { google } from "googleapis";

const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
let calendarClient;

function client() {
  if (calendarClient) return calendarClient;
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  calendarClient = google.calendar({ version: "v3", auth });
  return calendarClient;
}

/** Return Google Calendar busy intervals within the requested time range. */
export async function getBusy(timeMin, timeMax, timeZone) {
  const { data } = await client().freebusy.query({
    requestBody: { timeMin, timeMax, timeZone, items: [{ id: calendarId }] },
  });
  return data.calendars[calendarId].busy || [];
}

/** Create a Google Calendar appointment and return its identifier and link. */
export async function insertEvent({ summary, description, start, end, timeZone }) {
  const { data } = await client().events.insert({
    calendarId,
    requestBody: { summary, description, start: { dateTime: start, timeZone }, end: { dateTime: end, timeZone } },
  });
  return { id: data.id, link: data.htmlLink };
}
