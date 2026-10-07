import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DateTime } from "luxon";
import { z } from "zod";
import { config } from "../config.js";
import { getBusy, insertEvent } from "./calendar.js";
import { computeFreeSlots, isWithinClinicHours } from "./slots.js";

const { clinic } = config;
const server = new McpServer({ name: "dental-calendar", version: "1.0.0" });
const text = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj) }] });

async function busyForDay(date) {
  const day = DateTime.fromISO(date, { zone: clinic.tz });
  return getBusy(day.startOf("day").toISO(), day.endOf("day").toISO(), clinic.tz);
}

server.tool(
  "check_availability",
  "List free appointment slots at the dental clinic for one date. Always call this before offering times.",
  {
    date: z.string().describe("Date in YYYY-MM-DD format"),
    durationMins: z.number().int().min(15).max(180).default(30).describe("Appointment length in minutes"),
  },
  async ({ date, durationMins }) => {
    try {
      const busy = await busyForDay(date);
      const slots = computeFreeSlots({ date, durationMins, busy, clinic });
      if (!slots.length) return text({ date, available: false, message: "No free slots (closed, fully booked, or in the past)." });
      return text({ date, available: true, timezone: clinic.tz, slots });
    } catch (e) {
      return text({ error: e.message });
    }
  }
);

server.tool(
  "create_appointment",
  "Book an appointment in the clinic's Google Calendar. Only call after the patient has confirmed the exact slot.",
  {
    patientName: z.string(),
    phone: z.string(),
    service: z.string().describe("Treatment, e.g. 'Teeth whitening'"),
    startTime: z.string().describe("Start time as an ISO datetime taken from check_availability"),
    durationMins: z.number().int().min(15).max(180).default(30),
  },
  async ({ patientName, phone, service, startTime, durationMins }) => {
    try {
      if (!isWithinClinicHours(startTime, durationMins, clinic)) {
        return text({ booked: false, error: "That time is outside clinic hours." });
      }
      // Re-check right before insert to prevent double-booking.
      const start = DateTime.fromISO(startTime, { zone: clinic.tz });
      const day = start.toFormat("yyyy-MM-dd");
      const free = computeFreeSlots({ date: day, durationMins, busy: await busyForDay(day), clinic });
      if (!free.some((s) => DateTime.fromISO(s.start).toMillis() === start.toMillis())) {
        return text({ booked: false, error: "That slot is no longer available. Offer other times." });
      }
      const end = start.plus({ minutes: durationMins });
      const ev = await insertEvent({
        summary: `${service} - ${patientName}`,
        description: `Patient: ${patientName}\nPhone: ${phone}\nService: ${service}\nBooked via AI assistant`,
        start: start.toISO(),
        end: end.toISO(),
        timeZone: clinic.tz,
      });
      return text({ booked: true, eventId: ev.id, link: ev.link, when: start.toFormat("cccc d LLLL yyyy, h:mm a") });
    } catch (e) {
      return text({ booked: false, error: e.message });
    }
  }
);

await server.connect(new StdioServerTransport());
