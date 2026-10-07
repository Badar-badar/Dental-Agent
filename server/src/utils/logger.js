/** Log an informational message with a consistent tag prefix. */
export function info(tag, ...values) {
  console.log(`[${tag}]`, ...values);
}

/** Log an error with a consistent tag prefix. */
export function error(tag, ...values) {
  console.error(`[${tag}]`, ...values);
}
