const isHeading = (line) => /^[A-Z][A-Z\s,'&/-]{5,}$/.test(line.trim());

/** Split extracted PDF text into section chunks, each prefixed by its heading. */
export function chunkText(text, maxChars = 700) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
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
  for (const s of sections) {
    let buf = [];
    let len = 0;
    const flush = () => {
      if (buf.length) chunks.push(`${s.heading}\n${buf.join("\n")}`);
      buf = [];
      len = 0;
    };
    for (const l of s.lines) {
      if (len + l.length > maxChars) flush();
      buf.push(l);
      len += l.length;
    }
    flush();
  }
  return chunks;
}
