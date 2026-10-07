import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DateTime } from "luxon";
import { z } from "zod";
import { config } from "../../config/index.js";
import { getBusy, insertEvent } from "../providers/index.js";
import { computeFreeSlots, isWithinClinicHours } from "./slots.js";
import { error as logError } from "../../utils/logger.js";

const { clinic } = config;
const server = new McpServer({ name: "dental-calendar", version: "1.0.0" });
const text = (value) => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }],
});

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
      if (!slots.length) {
        return text({ date, available: false, message: "No free slots (closed, fully booked, or in the past)." });
      }
      return text({ date, available: true, timezone: clinic.tz, slots });
    } catch (caught) {
      logError("mcp", caught);
      return text({ available: false, error: "The calendar service is temporarily unavailable." });
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
      const start = DateTime.fromISO(startTime, { zone: clinic.tz });
      const day = start.toFormat("yyyy-MM-dd");
      const free = computeFreeSlots({
        date: day,
        durationMins,
        busy: await busyForDay(day),
        clinic,
      });
      if (!free.some((slot) => DateTime.fromISO(slot.start).toMillis() === start.toMillis())) {
        return text({ booked: false, error: "That slot is no longer available. Offer other times." });
      }
      const end = start.plus({ minutes: durationMins });
      const event = await insertEvent({
        summary: `${service} - ${patientName}`,
        description: `Patient: ${patientName}\nPhone: ${phone}\nService: ${service}\nBooked via AI assistant`,
        start: start.toISO(),
        end: end.toISO(),
        timeZone: clinic.tz,
      });
      return text({
        booked: true,
        eventId: event.id,
        link: event.link,
        when: start.toFormat("cccc d LLLL yyyy, h:mm a"),
      });
    } catch (caught) {
      logError("mcp", caught);
      return text({
        booked: false,
        error: "The calendar tool failed. The appointment has not been booked.",
      });
    }
  }
);

await server.connect(new StdioServerTransport());
