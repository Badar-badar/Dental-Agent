import path from "node:path";
import { fileURLToPath } from "node:url";
import { DateTime } from "luxon";
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { config } from "./config.js";
import { searchPriceList } from "./rag/search.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ai = new GoogleGenAI({ apiKey: config.geminiKey });

// --- MCP client: spawn the calendar MCP server and discover its tools ---
const mcp = new Client({ name: "dental-agent", version: "1.0.0" });
let functionDeclarations = [];

const RAG_TOOL = {
  name: "search_price_list",
  description:
    "Search the clinic's price list and policies (prices, treatment durations, opening hours, cancellation and payment rules).",
  parametersJsonSchema: {
    type: "object",
    properties: { query: { type: "string", description: "What to look up, e.g. 'root canal price'" } },
    required: ["query"],
  },
};

export async function initAgent() {
  await mcp.connect(
    new StdioClientTransport({
      command: "node",
      args: [path.join(__dirname, "mcp/calendarServer.js")],
      env: process.env,
    })
  );
  const { tools } = await mcp.listTools();
  console.log("[mcp] tools:", tools.map((t) => t.name).join(", "));
  functionDeclarations = [
    RAG_TOOL,
    ...tools.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: t.inputSchema })),
  ];
}

function systemPrompt() {
  const now = DateTime.now().setZone(config.clinic.tz);
  return `You are the virtual receptionist for ${config.clinic.name}. Be warm, brief and clear.

Current date and time: ${now.toFormat("cccc, d LLLL yyyy, h:mm a")} (${config.clinic.tz}).
Clinic hours: Monday to Saturday, ${config.clinic.openHour}:00 to ${config.clinic.closeHour}:00 (24h). Closed Sunday.

Rules:
- For any question about prices, treatments, durations, hours or policies, call search_price_list and answer ONLY from what it returns. If the answer is not there, say you don't have that information and suggest calling the clinic. Never invent prices.
- Booking flow: find out the service, then the preferred date, then call check_availability (use the treatment duration from the price list; default 30 minutes). Offer 3 to 4 of the returned slots.
- Before booking, collect the patient's full name and phone number, and confirm service, date and time back to them.
- Only after they confirm, call create_appointment using the exact start time from check_availability.
- If a booking fails, apologise briefly and offer other slots.
- Resolve relative dates ("tomorrow", "next Monday") using the current date above.
- You are not a doctor: do not give medical diagnoses. For pain or emergencies, advise calling the clinic or coming in as an emergency walk-in.`;
}

async function runTool(name, args) {
  if (name === "search_price_list") {
    return { results: await searchPriceList(args.query) };
  }
  const res = await mcp.callTool({ name, arguments: args });
  const raw = res.content?.[0]?.text ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    return { output: raw };
  }
}

/** Run the Gemini tool-calling loop. `contents` is mutated with the new turns. */
export async function runAgent(contents) {
  const toolsUsed = [];
  for (let step = 0; step < 6; step++) {
    const res = await ai.models.generateContent({
      model: config.model,
      contents,
      config: {
        systemInstruction: systemPrompt(),
        tools: [{ functionDeclarations }],
        temperature: 0.3,
      },
    });

    const modelContent = res.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const calls = res.functionCalls;
    if (!calls?.length) return { reply: res.text || "Sorry, I couldn't generate a reply.", toolsUsed };

    const parts = [];
    for (const call of calls) {
      toolsUsed.push(call.name);
      console.log(`[agent] tool ${call.name}`, JSON.stringify(call.args));
      let output;
      try {
        output = await runTool(call.name, call.args || {});
      } catch (e) {
        output = { error: e.message };
      }
      parts.push({ functionResponse: { name: call.name, response: output } });
    }
    contents.push({ role: "user", parts });
  }
  return { reply: "Sorry, I got stuck. Could you rephrase that?", toolsUsed };
}
