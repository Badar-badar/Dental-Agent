const num = (v, d) => (v === undefined || v === "" ? d : Number(v));

export const config = {
  port: num(process.env.PORT, 4000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/dental",
  chromaHost: process.env.CHROMA_HOST || "localhost",
  chromaPort: num(process.env.CHROMA_PORT, 8000),
  geminiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  embedModel: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
  embedDims: num(process.env.EMBED_DIMS, 768),
  clinic: {
    name: process.env.CLINIC_NAME || "BrightSmile Dental",
    tz: process.env.CLINIC_TZ || "Asia/Karachi",
    openHour: num(process.env.CLINIC_OPEN_HOUR, 9),
    closeHour: num(process.env.CLINIC_CLOSE_HOUR, 17),
    openDays: (process.env.CLINIC_OPEN_DAYS || "1,2,3,4,5,6").split(",").map(Number),
  },
};
