import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PDF_PATH = path.join(__dirname, "../../../data/knowledge-base/price-list.pdf");

// Headings are ALL CAPS lines. The ingest step splits on them.
const SECTIONS = [
  {
    heading: "GENERAL DENTISTRY",
    lines: [
      "Dental checkup and consultation - PKR 1,500 (30 min)",
      "Digital X-ray (single) - PKR 1,000 (10 min)",
      "Scaling and polishing (cleaning) - PKR 4,500 (45 min)",
      "Tooth-colored filling (composite) - PKR 5,000 per tooth (45 min)",
      "Simple tooth extraction - PKR 3,500 (30 min)",
      "Surgical or wisdom tooth extraction - PKR 12,000 (60 min)",
    ],
  },
  {
    heading: "ROOT CANAL AND CROWNS",
    lines: [
      "Root canal treatment, front tooth - PKR 12,000 (60 min)",
      "Root canal treatment, molar - PKR 18,000 (90 min)",
      "Porcelain-fused-to-metal crown - PKR 15,000 per tooth",
      "Zirconia crown - PKR 28,000 per tooth",
      "Crowns usually need two visits about one week apart.",
    ],
  },
  {
    heading: "COSMETIC DENTISTRY",
    lines: [
      "In-clinic teeth whitening - PKR 25,000 (60 min)",
      "Take-home whitening kit - PKR 12,000",
      "Porcelain veneer - PKR 30,000 per tooth",
      "Smile makeover consultation - PKR 2,000 (45 min), adjusted against treatment if you proceed",
    ],
  },
  {
    heading: "ORTHODONTICS",
    lines: [
      "Braces consultation and scan - PKR 3,000 (45 min)",
      "Metal braces, full treatment - PKR 120,000 (18 to 24 months)",
      "Ceramic braces, full treatment - PKR 180,000 (18 to 24 months)",
      "Clear aligners - from PKR 350,000, depending on the case",
      "Monthly adjustment visit - PKR 3,000 (30 min)",
    ],
  },
  {
    heading: "CHILDREN'S DENTISTRY",
    lines: [
      "Child checkup (under 12) - PKR 1,000 (30 min)",
      "Fluoride application - PKR 2,000 (20 min)",
      "Fissure sealant - PKR 2,500 per tooth",
      "Milk tooth extraction - PKR 2,000 (20 min)",
    ],
  },
  {
    heading: "CLINIC HOURS AND POLICIES",
    lines: [
      "Open Monday to Saturday, 9:00 AM to 5:00 PM. Closed on Sundays.",
      "Appointments can be cancelled or rescheduled free of charge up to 24 hours before the visit.",
      "Late cancellations or missed appointments may be charged PKR 1,000.",
      "Payment methods: cash, debit or credit card, and bank transfer.",
      "Installment plans are available for treatments above PKR 50,000.",
      "Emergency walk-ins during opening hours are welcome, with an emergency fee of PKR 1,500.",
      "All prices are in Pakistani rupees and may change after clinical examination.",
    ],
  },
];

/** Generate the clinic price-list PDF at the configured knowledge-base path. */
export async function generatePdf(clinicName = "BrightSmile Dental") {
  fs.mkdirSync(path.dirname(PDF_PATH), { recursive: true });
  const doc = new PDFDocument({ margin: 56 });
  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  doc.fontSize(22).text(clinicName + " Price List", { align: "left" });
  doc.moveDown(0.3).fontSize(10).text("Effective 2026. Prices in PKR.");
  for (const section of SECTIONS) {
    doc.moveDown(1).fontSize(13).font("Helvetica-Bold").text(section.heading);
    doc.moveDown(0.3).font("Helvetica").fontSize(11);
    for (const line of section.lines) doc.text(line);
  }
  doc.end();
  await new Promise((resolve) => stream.on("finish", resolve));
  return PDF_PATH;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generatePdf().then((pdfPath) => console.log("PDF written to", pdfPath));
}
