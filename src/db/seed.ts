import { db, client } from "./index";
import { volumes, chunks } from "./schema";
import { sql } from "drizzle-orm";
import { embedDocuments } from "../lib/embed";

const SEED_VOLUMES = [
  {
    titleEn: "Citizenship certificate by descent",
    titleNe: "वंशजको आधारमा नागरिकता प्रमाणपत्र",
    category: "Identity",
    keywords:
      "citizenship nagarikta nagrikta नागरिकता descent bansaj वंशज cdo district administration identity napi 16 pramanpatra प्रमाणपत्र nagarik",
    sampleQuestions: [
      {
        en: "What do I need for a citizenship certificate?",
        ne: "नागरिकता प्रमाणपत्रका लागि के के चाहिन्छ?",
        rom: "Nagarikta pramanpatra ko lagi ke ke chahincha?",
      },
    ],
    body: `Office: District Administration Office (Jilla Prashasan Karyalaya) of the district where the applicant is permanently registered.
Who can apply: Any person aged 16 years or above whose father or mother already holds Nepali citizenship.
Documents to bring:
- Birth registration certificate (janma darta pramanpatra) issued by the ward office
- Certified copy of father's or mother's citizenship certificate
- Migration certificate (basai sarai) if the family moved districts
- Recommendation letter from the ward office confirming permanent residence
- School leaving certificate or character certificate if available, used to confirm date of birth
- Four recent passport-size photographs, taken against a light background
- Applicant must appear in person with a relative who already holds citizenship
Fee: Rs. 10 for the application form. No charge for a first-time certificate.
Time: Same day at most district offices if the file is complete. Two to three days if the ward recommendation needs verification.
Common reasons files are returned: date of birth on the birth certificate does not match the school certificate; the accompanying relative is not a first-degree relation; photographs are older than six months.
Note: A replacement for a lost certificate is a separate process and requires a police report.`,
  },
  {
    titleEn: "Ordinary e-passport",
    titleNe: "साधारण इ-राहदानी",
    category: "Travel",
    keywords:
      "passport rahadani rahdani राहदानी epassport travel 34 page renewal mrp department passports embassy yatra",
    sampleQuestions: [
      {
        en: "How much does a passport cost and how long does it take?",
        ne: "राहदानीको दस्तुर कति र कति दिन लाग्छ?",
        rom: "Rahadani ko dastur kati ho ra kati din lagcha?",
      },
    ],
    body: `Office: Department of Passports in Kathmandu, or the District Administration Office of your district. Applications from abroad go through the Nepali embassy.
Documents to bring:
- Original citizenship certificate plus one photocopy
- Completed application form, filled in capital letters in English
- Previous passport if this is a renewal
- Minors under 16 need the birth certificate and both parents' citizenship copies, and a parent must sign
Photograph: taken at the counter. Do not wear glasses, a cap, or clothing that covers the ears.
Fee (34-page, 10-year validity): Rs. 5,000 for regular service and Rs. 12,000 for fast-track service.
Time: Regular service delivers in about 15 working days. Fast-track service at the Department of Passports delivers in 3 working days. Collection is in person with the original receipt.
Common reasons files are returned: name spelling on the form does not match the citizenship certificate; the citizenship photocopy is unreadable; the applicant's signature crosses the signature box.
Note: A lost passport requires a police report and a written explanation before a replacement is issued.`,
  },
  {
    titleEn: "Driving licence, category A and B",
    titleNe: "सवारी चालक अनुमतिपत्र — क र ख वर्ग",
    category: "Transport",
    keywords:
      "driving licence license chalak anumatipatra सवारी चालक bike car scooter trial written exam yatayat transport motorcycle sawari",
    sampleQuestions: [
      {
        en: "What do I need for a driving licence?",
        ne: "सवारी चालक अनुमतिपत्रका लागि के चाहिन्छ?",
        rom: "Sawari chalak anumatipatra ko lagi ke chahincha?",
      },
    ],
    body: `Office: Transport Management Office (Yatayat Byabasthapan Karyalaya) of your zone.
Who can apply: Age 16 and above for category A (scooter and motorcycle). Age 18 and above for category B (car, jeep and van).
Steps: online form, biometric registration at the office, written examination, then the practical trial.
Documents to bring:
- Citizenship certificate, original and photocopy
- Medical report from a recognised health post covering eyesight and blood group
- Printed copy of the online application with the biometric appointment slip
- Two passport-size photographs
Fee: Rs. 1,500 for a single category. Rs. 2,000 for two categories taken together. Trial re-attempt costs Rs. 300.
Time: Written examination usually falls within two weeks of biometric registration. The trial is scheduled after a pass. The smart licence card arrives by post in about three months; a temporary printed licence covers you until then.
Common reasons candidates fail: not stopping fully at the trial stop line; putting a foot down on the figure-of-eight track; medical report older than six months.`,
  },
  {
    titleEn: "Birth registration",
    titleNe: "जन्म दर्ता",
    category: "Vital events",
    keywords:
      "birth janma जन्म darta दर्ता newborn baby ward panjikaran registration baccha hospital 35 days sisu",
    sampleQuestions: [
      {
        en: "My baby was born last week. What do I do?",
        ne: "गत हप्ता बच्चा जन्मियो। अब के गर्ने?",
        rom: "Gata hapta baccha janmiyo. Aba ke garne?",
      },
    ],
    body: `Office: Ward office of the local level where the mother permanently resides.
Deadline: Within 35 days of birth. Registration after 35 days is still accepted but is treated as a late registration and needs a written explanation.
Who can register: The father, the mother, or the head of the household. If none is available, the eldest member of the family may register.
Documents to bring:
- Hospital birth record, or a recommendation from the health worker if the birth was at home
- Citizenship certificates of both parents, original and photocopy
- Marriage registration certificate of the parents if available
- Household details for the ward register
Fee: Free within 35 days. A late fee of Rs. 100 applies afterwards.
Time: Issued the same day at the ward counter.
Common reasons files are returned: the child's name is spelled differently on the hospital record and the application; the mother's ward of permanent residence differs from where the application was filed.`,
  },
  {
    titleEn: "Permanent Account Number for individuals",
    titleNe: "व्यक्तिगत स्थायी लेखा नम्बर",
    category: "Tax",
    keywords:
      "pan पान tax kar कर स्थायी लेखा ird inland revenue salary taxpayer sthaayi lekha number",
    sampleQuestions: [
      {
        en: "How do I get a PAN number?",
        ne: "स्थायी लेखा नम्बर कसरी पाउने?",
        rom: "Sthaayi lekha number kasari paune?",
      },
    ],
    body: `Office: Inland Revenue Office or Taxpayer Service Office for your area. The application starts on the IRD online portal.
Who needs it: Anyone earning a salary, running a business, or entering into a contract with a government body.
Documents to bring:
- Citizenship certificate, original and photocopy
- Two passport-size photographs
- Printed submission receipt from the online portal
- Employment letter, for a salaried applicant
- Rent agreement or ownership document of the business premises, for a business applicant
Fee: No charge for a personal PAN.
Time: Issued the same day if the online submission is complete and the biometric step is done at the counter.
Common reasons files are returned: the online form was submitted under the wrong tax office; the photograph uploaded online does not match the person at the counter.`,
  },
  {
    titleEn: "Marriage registration",
    titleNe: "विवाह दर्ता",
    category: "Vital events",
    keywords:
      "marriage vivah बिबाह विवाह darta wedding spouse ward certificate bibah bihe pati patni",
    sampleQuestions: [
      {
        en: "What do we need to register our marriage?",
        ne: "विवाह दर्ताका लागि के चाहिन्छ?",
        rom: "Vivah darta ko lagi ke chahincha?",
      },
    ],
    body: `Office: Ward office of the local level where the husband or the wife permanently resides.
Who can register: Both parties together. Both must be 20 years of age or above.
Documents to bring:
- Citizenship certificates of both parties, original and photocopy
- Two witnesses with their own citizenship certificates
- Two joint photographs of the couple
- Recommendation from the ward if the wedding took place elsewhere
- Divorce certificate or death certificate of a previous spouse, where applicable
Fee: Rs. 200 within 35 days of the wedding. Rs. 500 after that.
Time: Issued the same day at the ward counter when both parties and both witnesses attend.
Note: The certificate is commonly required for a spouse visa, for a joint bank account, and for adding a spouse to property records.`,
  },
  {
    titleEn: "Transfer of land ownership by sale",
    titleNe: "जग्गा किनबेच रजिस्ट्रेशन",
    category: "Land",
    keywords:
      "land jagga जग्गा lalpurja लालपुर्जा malpot मालपोत registration sale property transfer kinbech bhoomi rajistration",
    sampleQuestions: [
      {
        en: "I want to buy land. What papers does the seller need?",
        ne: "जग्गा किन्न लागेको छु। बेच्नेले के कागज ल्याउनुपर्छ?",
        rom: "Jagga kinna lageko chu. Bechne le ke kagaj lyaunuparcha?",
      },
    ],
    body: `Office: Land Revenue Office (Malpot Karyalaya) covering the plot.
Documents to bring:
- Original ownership certificate (lalpurja) of the seller
- Citizenship certificates of both buyer and seller, original and photocopy
- Blueprint of the plot from the Survey Office, issued within the last six months
- Land revenue clearance receipt showing tax paid up to the current fiscal year
- Recommendation from the ward confirming there is no dispute over the plot
- Two passport-size photographs of both parties
- Both parties present in person, or an authorised representative holding a registered power of attorney
Fee: Registration fee is a percentage of the valuation set by the office. Municipal areas are charged at a higher rate than rural municipalities. The office publishes the current rate at the counter.
Time: Registration is completed the same day when the file is complete. The new ownership certificate is printed within three working days.
Common reasons files are returned: land revenue not cleared for the current year; blueprint older than six months; a co-owner named on the certificate is absent.`,
  },
  {
    titleEn: "Senior citizen social security allowance",
    titleNe: "ज्येष्ठ नागरिक सामाजिक सुरक्षा भत्ता",
    category: "Welfare",
    keywords:
      "allowance bhatta भत्ता social security samajik suraksha senior jestha nagarik ज्येष्ठ pension 68 elderly briddha briddhi",
    sampleQuestions: [
      {
        en: "How does my grandfather apply for the senior citizen allowance?",
        ne: "मेरो बाजेले ज्येष्ठ नागरिक भत्ता कसरी पाउन सक्नुहुन्छ?",
        rom: "Mero baje le jestha nagarik bhatta kasari pauna saknuhuncha?",
      },
    ],
    body: `Office: Ward office of the local level where the applicant is registered.
Who can apply: Nepali citizens aged 68 and above. Applicants from Dalit communities and from listed remote areas qualify at 60.
Registration window: Applications are collected in the month of Mangsir each year, and payment begins from the following fiscal year.
Documents to bring:
- Citizenship certificate, original and photocopy
- Two passport-size photographs
- Bank account details in the applicant's own name
- Recommendation from the ward confirming residence
Fee: No charge.
Payment: Four instalments a year, paid directly into the applicant's bank account.
Common reasons applications are rejected: the bank account is a joint account; the date of birth on the citizenship certificate makes the applicant younger than the threshold; the applicant is already drawing a government pension.`,
  },
];

async function seed() {
  console.log("Ensuring extensions...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  console.log("Loading embedding model...");
  const testEmbed = await embedDocuments(["startup check"]);
  if (!testEmbed[0]?.length) {
    throw new Error("Embedding pipeline failed to produce output");
  }
  console.log(`  Model loaded (dim ${testEmbed[0].length})`);

  console.log("Truncating seed tables...");
  await db.execute(sql`TRUNCATE chunks, volumes CASCADE`);

  console.log("Inserting volumes...");
  const embeddingTexts = SEED_VOLUMES.map(
    (v) => `${v.titleEn}. ${v.category}. ${v.body}`
  );
  const embeddings = await embedDocuments(embeddingTexts);

  for (let i = 0; i < SEED_VOLUMES.length; i++) {
    const v = SEED_VOLUMES[i];
    const [vol] = await db
      .insert(volumes)
      .values({
        titleEn: v.titleEn,
        titleNe: v.titleNe,
        category: v.category,
        status: "active",
        sampleQuestions: v.sampleQuestions,
      })
      .returning();

    await db.insert(chunks).values({
      volumeId: vol.id,
      heading: v.titleEn,
      content: v.body,
      keywordsMultiscript: v.keywords,
      embedding: embeddings[i],
      tokenCount: Math.ceil(v.body.length / 4),
    });

    console.log(`  [${i + 1}/8] ${v.titleEn}`);
  }

  console.log("Creating search indexes...");

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING hnsw (embedding vector_cosine_ops)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chunks_fts_idx
    ON chunks USING gin (to_tsvector('english', content))
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chunks_keywords_trgm_idx
    ON chunks USING gin (keywords_multiscript gin_trgm_ops)
  `);

  console.log("Verifying setup...");

  const [{ count: volCount }] = (await db.execute(
    sql`SELECT count(*)::int as count FROM volumes`
  )) as unknown as [{ count: number }];
  const [{ count: chunkCount }] = (await db.execute(
    sql`SELECT count(*)::int as count FROM chunks`
  )) as unknown as [{ count: number }];

  const idxRows = (await db.execute(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'chunks'
    ORDER BY indexname
  `)) as unknown as { indexname: string; indexdef: string }[];

  console.log(`\n  ${volCount} volumes, ${chunkCount} chunks`);
  console.log("  Indexes:");
  for (const row of idxRows) {
    console.log(`    ${row.indexname}`);
  }

  console.log("\nDone.");
  await client.end();
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
