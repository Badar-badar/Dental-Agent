import * as googleCalendar from "./googleCalendar.js";
import * as mockCalendar from "./mockCalendar.js";

const calendarProvider = process.env.MOCK_CALENDAR === "true" ? mockCalendar : googleCalendar;

/** Return calendar busy intervals using the provider selected by MOCK_CALENDAR. */
export const getBusy = (...args) => calendarProvider.getBusy(...args);

/** Create an appointment through the provider selected by MOCK_CALENDAR. */
export const insertEvent = (...args) => calendarProvider.insertEvent(...args);
