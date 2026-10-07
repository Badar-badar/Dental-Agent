import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { config } from "../config/index.js";
import { buildSystemPrompt } from "../prompts/systemPrompt.js";
import { searchPriceList } from "../rag/retriever.js";
import { info } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ai = new GoogleGenAI({ apiKey: config.geminiKey });
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

/** Spawn the MCP calendar server and load its tools for Gemini function calling. */
export async function initAgent() {
  await mcp.connect(
    new StdioClientTransport({
      command: "node",
      args: [path.join(__dirname, "../mcp/server/calendarServer.js")],
      env: process.env,
    })
  );
  const { tools } = await mcp.listTools();
  info("mcp", "tools:", tools.map((tool) => tool.name).join(", "));
  functionDeclarations = [
    RAG_TOOL,
    ...tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.inputSchema,
    })),
  ];
}

async function runTool(name, args) {
  if (name === "search_price_list") {
    return { results: await searchPriceList(args.query) };
  }
  const response = await mcp.callTool({ name, arguments: args });
  const raw = response.content?.[0]?.text ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    return { output: raw };
  }
}

/** Run the Gemini tool-calling loop; `contents` is mutated with the new turns. */
export async function runAgent(contents) {
  const toolsUsed = [];
  for (let step = 0; step < 6; step++) {
    const response = await ai.models.generateContent({
      model: config.model,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(),
        tools: [{ functionDeclarations }],
        temperature: 0.3,
      },
    });

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const calls = response.functionCalls;
    if (!calls?.length) {
      return { reply: response.text || "Sorry, I couldn't generate a reply.", toolsUsed };
    }

    const parts = [];
    for (const call of calls) {
      toolsUsed.push(call.name);
      info("agent", `tool ${call.name}`, JSON.stringify(call.args));
      let output;
      try {
        output = await runTool(call.name, call.args || {});
      } catch (caught) {
        output = { error: caught.message };
      }
      parts.push({ functionResponse: { name: call.name, response: output } });
    }
    contents.push({ role: "user", parts });
  }
  return { reply: "Sorry, I got stuck. Could you rephrase that?", toolsUsed };
}
