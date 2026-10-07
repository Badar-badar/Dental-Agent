const isHeading = (line) => /^[A-Z][A-Z\s,'&/-]{5,}$/.test(line.trim());

/** Split extracted PDF text into section chunks, each prefixed by its heading. */
export function chunkText(text, maxChars = 700) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (isHeading(line)) {
      current = { heading: line, lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }

  const chunks = [];
  for (const section of sections) {
    let buffer = [];
    let length = 0;
    const flush = () => {
      if (buffer.length) chunks.push(`${section.heading}\n${buffer.join("\n")}`);
      buffer = [];
      length = 0;
    };
    for (const line of section.lines) {
      if (length + line.length > maxChars) flush();
      buffer.push(line);
      length += line.length;
    }
    flush();
  }
  return chunks;
}
