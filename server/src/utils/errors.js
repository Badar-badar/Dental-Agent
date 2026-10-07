const ERROR_MESSAGES = {
  busy: "The assistant is busy at the moment. Please try again in a minute.",
  quota: "We're receiving a lot of requests right now. Please try again in a minute.",
  config: "The assistant is temporarily unavailable. Please try again later.",
  service: "We couldn't load the clinic information just now. Please try again in a moment.",
  invalid: "Please keep your message under 500 characters.",
  rate_limit: "You've sent a lot of messages. Please wait a few minutes and try again.",
  unknown: "Something went wrong on our side. Please try again.",
};

function errorChain(error) {
  const chain = [];
  const seen = new Set();
  for (let current = error; current && !seen.has(current); current = current.cause) {
    chain.push(current);
    seen.add(current);
  }
  return chain;
}

/** Map technical errors to the stable, user-safe chat error contract. */
export function toUserError(err) {
  const errors = errorChain(err);
  const codes = errors.map((error) => String(error.code || "").toUpperCase());
  const statuses = errors.map((error) => Number(error.status ?? error.statusCode ?? error.response?.status));
  const statusValues = errors.map((error) => String(error.status ?? "").toUpperCase());
  const geminiCodes = ["INVALID_ARGUMENT", "UNAUTHENTICATED", "PERMISSION_DENIED", "NOT_FOUND"];
  const details = errors
    .map((error) => `${error.name || ""} ${error.message || ""} ${error.address || ""}`)
    .join(" ")
    .toLowerCase();
  const isGeminiError = errors.some((error) => error.name === "GeminiRequestError");

  let code = "unknown";
  let status = 500;

  if (codes.includes("CHAT_RATE_LIMIT")) {
    code = "rate_limit";
    status = 429;
  } else if (
    codes.includes("INVALID_BODY") ||
    codes.includes("ENTITY.TOO.LARGE") ||
    codes.includes("ENTITY.PARSE.FAILED")
  ) {
    code = "invalid";
    status = 400;
  } else if (
    /chroma|mongodb|mongoose|mongo(serverselection|networktimeout|server|network|driver)|econnrefused.*(27017|chroma)/i.test(details)
  ) {
    code = "service";
    status = 503;
  } else if (
    (isGeminiError && statuses.includes(429)) ||
    statuses.includes(429) ||
    statusValues.includes("RESOURCE_EXHAUSTED") ||
    codes.includes("RESOURCE_EXHAUSTED")
  ) {
    code = "busy";
    status = 429;
  } else if (
    isGeminiError &&
    (statuses.includes(503) || statuses.includes(500) || statusValues.includes("UNAVAILABLE") || codes.includes("UNAVAILABLE"))
  ) {
    code = "busy";
    status = 503;
  } else if (
    isGeminiError &&
    ([400, 401, 403, 404].some((value) => statuses.includes(value)) ||
      geminiCodes.some((value) => codes.includes(value)) ||
      codes.includes("MODEL_NOT_FOUND"))
  ) {
    code = "config";
    status = 502;
  }

  const quotaExceeded =
    statuses.includes(429) || statusValues.includes("RESOURCE_EXHAUSTED") || codes.includes("RESOURCE_EXHAUSTED");
  return { status, code, message: code === "busy" && quotaExceeded ? ERROR_MESSAGES.quota : ERROR_MESSAGES[code] };
}
