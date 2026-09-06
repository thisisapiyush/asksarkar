import React, { useState, useRef, useEffect, useMemo } from "react";

/* ============================================================
   Ask Sarkar — government service desk, in three languages.
   Demo build. All procedure data below is placeholder content.
   ============================================================ */

const C = {
  ink: "#16233A",       // ledger ink — headers, primary text
  inkSoft: "#4A5568",
  sindoor: "#C0362C",   // nagarikta crimson — the one loud colour
  paper: "#EDEFE8",     // office register paper
  rule: "#D5D9CB",      // hairline on register paper
  card: "#FCFCFA",
  brass: "#9A7B2E",     // seal brass — admin only
  green: "#2F6B4F",
};

/* ---------- language ---------- */

const LANGS = [
  { id: "en", label: "English" },
  { id: "ne", label: "नेपाली" },
  { id: "rom", label: "Nepali (Roman)" },
];

const UI = {
  en: {
    name: "Ask Sarkar",
    sub: "What papers do I need? Ask before you travel.",
    placeholder: "Ask about any government service…",
    send: "Ask",
    thinking: "Checking the files",
    startTitle: "The desk is open.",
    startBody:
      "Ask in Nepali or English. You'll get the document list, the office, the fee and the waiting time — in whichever language you picked above.",
    tryThese: "Common questions",
    sources: "Answered from",
    admin: "Office desk",
    citizen: "Back to asking",
    adminTitle: "Knowledge volumes",
    adminSub:
      "Paste a new circular, directive or procedure. The desk reads it, indexes it, and starts answering from it right away.",
    volTitle: "Volume title",
    volBody: "Paste the procedure text",
    volCat: "Service area",
    addVol: "Add to the desk",
    indexing: ["Reading the volume", "Pulling out the key terms", "Teaching the desk"],
    ready: "Desk updated",
    nowAnswers: "It can now answer questions like:",
    remove: "Remove",
    inLibrary: "volumes in the desk",
    demo: "Demo data. Not real government procedure — replace before any public use.",
    empty: "No volume text yet. Paste something for the desk to learn.",
    failed: "The desk could not reach its language service. Try asking again.",
    clear: "Clear this conversation",
  },
  ne: {
    name: "सरकारलाई सोध्नुहोस्",
    sub: "कुन कागजात चाहिन्छ? कार्यालय जानुअघि सोध्नुहोस्।",
    placeholder: "कुनै पनि सरकारी सेवाबारे सोध्नुहोस्…",
    send: "सोध्नुहोस्",
    thinking: "फाइल हेर्दै",
    startTitle: "डेस्क खुला छ।",
    startBody:
      "नेपाली वा अंग्रेजीमा सोध्नुहोस्। कागजातको सूची, कार्यालय, दस्तुर र लाग्ने समय — तपाईंले रोजेकै भाषामा पाउनुहुनेछ।",
    tryThese: "धेरै सोधिने प्रश्न",
    sources: "स्रोत",
    admin: "कार्यालय डेस्क",
    citizen: "सोध्न फर्कनुहोस्",
    adminTitle: "ज्ञान खण्डहरू",
    adminSub:
      "नयाँ परिपत्र, निर्देशिका वा कार्यविधि टाँस्नुहोस्। डेस्कले पढ्छ, सूचीकृत गर्छ र तुरुन्तै त्यहीबाट जवाफ दिन थाल्छ।",
    volTitle: "खण्डको शीर्षक",
    volBody: "कार्यविधिको पाठ टाँस्नुहोस्",
    volCat: "सेवा क्षेत्र",
    addVol: "डेस्कमा थप्नुहोस्",
    indexing: ["खण्ड पढ्दै", "मुख्य शब्द निकाल्दै", "डेस्कलाई सिकाउँदै"],
    ready: "डेस्क अद्यावधिक भयो",
    nowAnswers: "अब यस्ता प्रश्नको जवाफ दिन सक्छ:",
    remove: "हटाउनुहोस्",
    inLibrary: "खण्ड डेस्कमा छन्",
    demo: "नमुना सामग्री। वास्तविक सरकारी कार्यविधि होइन — सार्वजनिक प्रयोगअघि बदल्नुहोस्।",
    empty: "खण्डको पाठ छैन। डेस्कले सिक्न केही टाँस्नुहोस्।",
    failed: "डेस्कले भाषा सेवासँग सम्पर्क गर्न सकेन। फेरि सोध्नुहोस्।",
    clear: "यो कुराकानी मेटाउनुहोस्",
  },
  rom: {
    name: "Ask Sarkar",
    sub: "Kun kagajpatra chahincha? Karyalaya janu aghi sodhnuhos.",
    placeholder: "Junsukai sarkari sewa barema sodhnuhos…",
    send: "Sodhnuhos",
    thinking: "File herdai",
    startTitle: "Desk khula cha.",
    startBody:
      "Nepali wa English ma sodhnuhos. Kagajpatra ko suchi, karyalaya, dastur ra lagne samaya — tapaile rojeko bhasha mai painuhunecha.",
    tryThese: "Dherai sodhine prashna",
    sources: "Srot",
    admin: "Karyalaya desk",
    citizen: "Sodhna farkanuhos",
    adminTitle: "Gyan khandaharu",
    adminSub:
      "Naya paripatra, nirdeshika wa karyabidhi tansnuhos. Desk le padhcha, suchikrit garcha ra turuntai tyahibata jawaf dina thalcha.",
    volTitle: "Khanda ko sirshak",
    volBody: "Karyabidhi ko paath tansnuhos",
    volCat: "Sewa kshetra",
    addVol: "Desk ma thapnuhos",
    indexing: ["Khanda padhdai", "Mukhya shabda nikaldai", "Desk lai sikaudai"],
    ready: "Desk update bhayo",
    nowAnswers: "Aba yesta prashna ko jawaf dina sakcha:",
    remove: "Hataunuhos",
    inLibrary: "khanda desk ma chan",
    demo: "Namuna samagri. Wastavik sarkari karyabidhi hoina — sarwajanik prayog aghi badalnuhos.",
    empty: "Khanda ko paath chaina. Desk le sikna kehi tansnuhos.",
    failed: "Desk le bhasha sewa sanga sampark garna sakena. Feri sodhnuhos.",
    clear: "Yo kurakani metaunuhos",
  },
};

const LANG_RULE = {
  en: "Answer in plain, simple English. Short sentences. No jargon.",
  ne: "Answer in Nepali using Devanagari script only (नेपाली). Use everyday spoken Nepali, not heavy legal Nepali. Never write in Roman letters.",
  rom: "Answer in Nepali written with Roman/English letters only — transliteration, not translation. Example style: 'Tapailai nagarikta pramanpatra ko lagi janma darta pramanpatra ra bubako nagarikta ko copy chahincha.' Never use Devanagari script. Keep official document names in Roman Nepali with the English name in brackets the first time.",
};

/* ---------- seed knowledge (placeholder data) ---------- */

const SEED = [
  {
    id: "v-nagarikta",
    title: "Citizenship certificate by descent",
    titleNe: "वंशजको आधारमा नागरिकता प्रमाणपत्र",
    cat: "Identity",
    keywords: ["citizenship", "nagarikta", "नागरिकता", "descent", "bansaj", "वंशज", "cdo", "district administration", "identity", "napi", "16"],
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
    id: "v-passport",
    title: "Ordinary e-passport",
    titleNe: "साधारण इ-राहदानी",
    cat: "Travel",
    keywords: ["passport", "rahadani", "राहदानी", "epassport", "travel", "34 page", "renewal", "mrp"],
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
    id: "v-licence",
    title: "Driving licence, category A and B",
    titleNe: "सवारी चालक अनुमतिपत्र — क र ख वर्ग",
    cat: "Transport",
    keywords: ["driving", "licence", "license", "chalak", "anumatipatra", "सवारी", "चालक", "bike", "car", "trial", "written exam", "yatayat"],
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
    id: "v-birth",
    title: "Birth registration",
    titleNe: "जन्म दर्ता",
    cat: "Vital events",
    keywords: ["birth", "janma", "जन्म", "darta", "दर्ता", "newborn", "baby", "ward", "panjikaran"],
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
    id: "v-pan",
    title: "Permanent Account Number for individuals",
    titleNe: "व्यक्तिगत स्थायी लेखा नम्बर",
    cat: "Tax",
    keywords: ["pan", "पान", "tax", "kar", "स्थायी लेखा", "ird", "inland revenue", "salary", "taxpayer"],
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
    id: "v-marriage",
    title: "Marriage registration",
    titleNe: "विवाह दर्ता",
    cat: "Vital events",
    keywords: ["marriage", "vivah", "बिबाह", "विवाह", "darta", "wedding", "spouse", "ward", "certificate"],
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
    id: "v-land",
    title: "Transfer of land ownership by sale",
    titleNe: "जग्गा किनबेच रजिस्ट्रेशन",
    cat: "Land",
    keywords: ["land", "jagga", "जग्गा", "lalpurja", "लालपुर्जा", "malpot", "मालपोत", "registration", "sale", "property", "transfer", "kinbech"],
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
    id: "v-allowance",
    title: "Senior citizen social security allowance",
    titleNe: "ज्येष्ठ नागरिक सामाजिक सुरक्षा भत्ता",
    cat: "Welfare",
    keywords: ["allowance", "bhatta", "भत्ता", "social security", "samajik suraksha", "senior", "jestha nagarik", "ज्येष्ठ", "pension", "68", "elderly"],
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

const STARTERS = [
  { en: "What do I need for a citizenship certificate?", ne: "नागरिकता प्रमाणपत्रका लागि के के चाहिन्छ?", rom: "Nagarikta pramanpatra ko lagi ke ke chahincha?" },
  { en: "How much does a passport cost and how long does it take?", ne: "राहदानीको दस्तुर कति र कति दिन लाग्छ?", rom: "Rahadani ko dastur kati ho ra kati din lagcha?" },
  { en: "My baby was born last week. What do I do?", ne: "गत हप्ता बच्चा जन्मियो। अब के गर्ने?", rom: "Gata hapta baccha janmiyo. Aba ke garne?" },
  { en: "I want to buy land. What papers does the seller need?", ne: "जग्गा किन्न लागेको छु। बेच्नेले के कागज ल्याउनुपर्छ?", rom: "Jagga kinna lageko chu. Bechne le ke kagaj lyaunuparcha?" },
];

/* ---------- retrieval ---------- */

// Bridges Devanagari, Roman Nepali and English onto the same index terms.
const BRIDGE = {
  नागरिकता: "citizenship", nagarikta: "citizenship", nagrikta: "citizenship", citizenship: "citizenship",
  राहदानी: "passport", rahadani: "passport", rahdani: "passport", passport: "passport",
  सवारी: "driving", चालक: "driving", chalak: "driving", licence: "driving", license: "driving", driving: "driving", bike: "driving", car: "driving", scooter: "driving",
  जन्म: "birth", janma: "birth", birth: "birth", baby: "birth", baccha: "birth", newborn: "birth",
  विवाह: "marriage", बिबाह: "marriage", vivah: "marriage", bibah: "marriage", marriage: "marriage", wedding: "marriage", spouse: "marriage",
  जग्गा: "land", jagga: "land", lalpurja: "land", लालपुर्जा: "land", मालपोत: "land", malpot: "land", land: "land", property: "land",
  भत्ता: "allowance", bhatta: "allowance", allowance: "allowance", pension: "allowance", ज्येष्ठ: "allowance", jestha: "allowance", senior: "allowance", elderly: "allowance",
  पान: "pan", pan: "pan", कर: "tax", kar: "tax", tax: "tax",
  कागजात: "document", kagajpatra: "document", kagaj: "document", document: "document", documents: "document", papers: "document",
  दस्तुर: "fee", dastur: "fee", fee: "fee", cost: "fee", शुल्क: "fee", paisa: "fee", कति: "fee",
  कार्यालय: "office", karyalaya: "office", office: "office", वडा: "ward", wada: "ward", ward: "ward",
  समय: "time", samaya: "time", time: "time", din: "time", दिन: "time",
  नवीकरण: "renewal", nawikaran: "renewal", renew: "renewal", renewal: "renewal",
};

const STOP = new Set(["the","a","an","of","for","to","and","is","are","i","my","what","how","do","need","can","in","on","at","with","me","it","ko","ma","cha","ho","garne","lagi","kasari","ke","भए","को","मा","छ","के","गर्ने","लागि","र"]);

function tokenize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function expand(tokens) {
  const out = new Set();
  tokens.forEach((t) => {
    out.add(t);
    if (BRIDGE[t]) out.add(BRIDGE[t]);
    Object.keys(BRIDGE).forEach((k) => {
      if (k.length > 3 && (t.includes(k) || k.includes(t))) out.add(BRIDGE[k]);
    });
  });
  return [...out];
}

function retrieve(query, kb, k = 3) {
  const q = expand(tokenize(query));
  if (!q.length) return [];
  const scored = kb.map((v) => {
    const hay = expand(tokenize([v.title, v.titleNe, v.cat, (v.keywords || []).join(" "), v.body].join(" ")));
    const bag = new Set(hay);
    let score = 0;
    q.forEach((t) => {
      if (bag.has(t)) score += 1;
      if ((v.keywords || []).some((kw) => kw.toLowerCase() === t)) score += 2.5;
      if (String(v.title + v.titleNe).toLowerCase().includes(t)) score += 2;
    });
    return { v, score };
  });
  return scored.filter((s) => s.score >= 2).sort((a, b) => b.score - a.score).slice(0, k).map((s) => s.v);
}

/* ---------- model calls ---------- */

async function callClaude(messages, system, maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ---------- small pieces ---------- */

function Seal({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke={C.sindoor} strokeWidth="1.6" />
      <circle cx="20" cy="20" r="14" fill="none" stroke={C.sindoor} strokeWidth="0.8" strokeDasharray="2 2.6" />
      <path d="M20 9 l3.1 6.6 7.1 1 -5.2 5.2 1.3 7.2 -6.3 -3.5 -6.3 3.5 1.3 -7.2 -5.2 -5.2 7.1 -1z" fill={C.sindoor} opacity="0.9" />
    </svg>
  );
}

function Ruled({ children, style }) {
  return (
    <div
      style={{
        backgroundColor: C.paper,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, ${C.rule} 31px 32px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Rich({ text }) {
  const lines = String(text).split("\n");
  return (
    <div>
      {lines.map((ln, i) => {
        const t = ln.trim();
        if (!t) return <div key={i} style={{ height: 8 }} />;
        const bullet = /^[-•*]\s+/.test(t);
        const body = bullet ? t.replace(/^[-•*]\s+/, "") : t;
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} style={{ color: C.ink, fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p}</span>
          )
        );
        if (bullet) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, margin: "3px 0" }}>
              <span style={{ color: C.sindoor, lineHeight: 1.7, flexShrink: 0 }}>▪</span>
              <span style={{ lineHeight: 1.7 }}>{parts}</span>
            </div>
          );
        }
        return <p key={i} style={{ margin: "6px 0", lineHeight: 1.75 }}>{parts}</p>;
      })}
    </div>
  );
}

/* ============================================================ */

export default function AskSarkar() {
  const [lang, setLang] = useState("en");
  const [kb, setKb] = useState(SEED);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("ask");
  const [loaded, setLoaded] = useState(false);
  const t = UI[lang];
  const endRef = useRef(null);

  /* load any volumes the office added earlier */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("asksarkar:volumes");
        if (r && r.value) {
          const extra = JSON.parse(r.value);
          if (Array.isArray(extra) && extra.length) setKb([...SEED, ...extra]);
        }
      } catch (e) {
        /* first run — nothing stored yet */
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    setKb(next);
    try {
      await window.storage.set("asksarkar:volumes", JSON.stringify(next.filter((v) => v.added)));
    } catch (e) {
      /* storage unavailable; the desk still works for this session */
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const starters = useMemo(() => {
    const added = kb.filter((v) => v.added && v.samples).flatMap((v) => v.samples);
    return [...added.slice(0, 2), ...STARTERS].slice(0, 4);
  }, [kb]);

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);

    const hits = retrieve(q, kb);
    const context = hits.length
      ? hits.map((v) => `### ${v.title} (${v.titleNe})\nService area: ${v.cat}\n${v.body}`).join("\n\n---\n\n")
      : "NO MATCHING VOLUME FOUND IN THE DESK.";

    const system = `You are the front desk of "Ask Sarkar", a public help service for Nepali citizens. A citizen wants to know what to bring before travelling to a government office.

${LANG_RULE[lang]}

Answer only from the volumes below. Never invent a document, a fee, an office name or a waiting time. If the volumes do not cover the question, say so plainly and tell the person which office to phone — do not guess.

Shape of a good answer:
- One short opening line naming the service and the office.
- A bulleted list headed with what to bring, using "- ".
- Then fee and time, each on its own line.
- If the volumes mention common reasons files get returned, add one short warning line.
Keep the whole answer under 200 words. Do not add greetings or sign-offs. Do not mention "volumes", "context" or "documents provided".

VOLUMES FROM THE DESK:
${context}`;

    const history = msgs.slice(-6).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    try {
      const text = await callClaude([...history, { role: "user", content: q }], system);
      setMsgs((m) => [...m, { role: "assistant", text: text || t.failed, sources: hits.map((h) => (lang === "ne" ? h.titleNe : h.title)), grounded: hits.length > 0 }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: t.failed, sources: [], grounded: false }]);
    }
    setBusy(false);
  }

  /* ---------------- ask view ---------------- */

  const askView = (
    <>
      <Ruled style={{ flex: 1, overflowY: "auto", padding: "22px 18px 8px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {msgs.length === 0 && (
            <div style={{ paddingTop: 6 }}>
              <h2 style={{ fontFamily: "Khand, Mukta, system-ui, sans-serif", fontSize: 30, lineHeight: 1.15, color: C.ink, margin: "0 0 8px", fontWeight: 600 }}>
                {t.startTitle}
              </h2>
              <p style={{ margin: "0 0 26px", color: C.inkSoft, lineHeight: 1.75, maxWidth: "62ch" }}>{t.startBody}</p>
              <div style={{ color: C.inkSoft, fontSize: 13, marginBottom: 10, letterSpacing: "0.01em" }}>{t.tryThese}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(s[lang] || s.en)}
                    className="ss-chip"
                    style={{
                      textAlign: "left", background: C.card, border: `1px solid ${C.rule}`,
                      borderLeft: `3px solid ${C.sindoor}`, padding: "11px 14px", cursor: "pointer",
                      color: C.ink, fontSize: 15, lineHeight: 1.5, borderRadius: 2, fontFamily: "inherit",
                    }}
                  >
                    {s[lang] || s.en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end", margin: "18px 0 4px" }}>
                <div style={{ background: C.ink, color: "#F2F4F1", padding: "9px 14px", borderRadius: "3px 3px 3px 12px", maxWidth: "82%", lineHeight: 1.6, fontSize: 15 }}>
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} style={{ position: "relative", background: C.card, border: `1px solid ${C.rule}`, borderLeft: `3px solid ${C.sindoor}`, padding: "16px 18px 14px", margin: "14px 0 20px", borderRadius: 2, overflow: "hidden" }}>
                {m.grounded && (
                  <div style={{ position: "absolute", right: -6, top: 8, opacity: 0.09, transform: "rotate(-14deg)", pointerEvents: "none" }}>
                    <Seal size={96} />
                  </div>
                )}
                <div style={{ color: C.ink, fontSize: 15.5, position: "relative" }}>
                  <Rich text={m.text} />
                </div>
                {m.sources?.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dashed ${C.rule}`, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.inkSoft }}>{t.sources}</span>
                    {m.sources.map((s, j) => (
                      <span key={j} style={{ fontSize: 12, color: C.sindoor, border: `1px solid ${C.sindoor}33`, background: `${C.sindoor}0D`, padding: "2px 8px", borderRadius: 2 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {busy && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.inkSoft, margin: "16px 0", fontSize: 14 }}>
              <span className="ss-pulse" style={{ width: 8, height: 8, background: C.sindoor, borderRadius: "50%", display: "inline-block" }} />
              {t.thinking}…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </Ruled>

      <div style={{ borderTop: `1px solid ${C.rule}`, background: C.card, padding: "12px 18px 14px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
            }}
            placeholder={t.placeholder}
            className="ss-input"
            style={{
              flex: 1, resize: "none", padding: "11px 13px", fontSize: 15.5, lineHeight: 1.5,
              border: `1px solid ${C.rule}`, borderRadius: 2, background: "#fff", color: C.ink,
              fontFamily: "inherit", maxHeight: 120, minHeight: 44,
            }}
          />
          <button
            onClick={() => ask(input)}
            disabled={busy || !input.trim()}
            className="ss-send"
            style={{
              background: busy || !input.trim() ? C.rule : C.sindoor, color: "#fff", border: "none",
              padding: "0 20px", height: 44, borderRadius: 2, fontSize: 15, fontWeight: 600,
              cursor: busy || !input.trim() ? "default" : "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            {t.send}
          </button>
        </div>
        {msgs.length > 0 && (
          <div style={{ maxWidth: 700, margin: "8px auto 0" }}>
            <button onClick={() => setMsgs([])} style={{ background: "none", border: "none", color: C.inkSoft, fontSize: 12.5, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              {t.clear}
            </button>
          </div>
        )}
      </div>
    </>
  );

  /* ---------------- office view ---------------- */

  const officeView = <Office t={t} lang={lang} kb={kb} persist={persist} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.paper, color: C.ink, fontFamily: "Mukta, 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Khand:wght@500;600;700&family=Mukta:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        .ss-chip:hover { border-color: ${C.sindoor}; }
        .ss-input:focus, .ss-send:focus-visible, .ss-chip:focus-visible, button:focus-visible {
          outline: 2px solid ${C.sindoor}; outline-offset: 2px;
        }
        .ss-input:focus { border-color: ${C.sindoor}; }
        textarea, input, button { font-family: inherit; }
        @keyframes ssp { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        .ss-pulse { animation: ssp 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ss-pulse { animation: none; opacity: .7 } }
        ::-webkit-scrollbar { width: 9px } ::-webkit-scrollbar-thumb { background: ${C.rule} }
      `}</style>

      <header style={{ background: C.ink, color: "#EDEFE8", padding: "12px 18px", flexShrink: 0 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
          <div style={{ background: "#EDEFE8", borderRadius: "50%", width: 40, height: 40, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Seal />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontFamily: "Khand, Mukta, sans-serif", fontSize: 25, fontWeight: 600, letterSpacing: "0.015em", lineHeight: 1.05 }}>
              {t.name}
            </div>
            <div style={{ fontSize: 12.5, color: "#A9B4C4", lineHeight: 1.4 }}>{t.sub}</div>
          </div>
          <button
            onClick={() => setView(view === "ask" ? "office" : "ask")}
            style={{ background: "transparent", color: view === "office" ? C.card : "#A9B4C4", border: `1px solid ${view === "office" ? C.brass : "#3A4763"}`, padding: "6px 12px", borderRadius: 2, fontSize: 13, cursor: "pointer" }}
          >
            {view === "ask" ? t.admin : t.citizen}
          </button>
        </div>

        <div style={{ maxWidth: 700, margin: "11px auto 0", display: "flex", gap: 6 }}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              style={{
                flex: 1, padding: "7px 4px", fontSize: 13.5, cursor: "pointer", borderRadius: 2,
                background: lang === l.id ? C.sindoor : "transparent",
                color: lang === l.id ? "#fff" : "#A9B4C4",
                border: `1px solid ${lang === l.id ? C.sindoor : "#3A4763"}`,
                fontWeight: lang === l.id ? 600 : 400,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      {!loaded ? <Ruled style={{ flex: 1 }} /> : view === "ask" ? askView : officeView}

      <div style={{ background: C.ink, color: "#7E8CA3", fontSize: 11.5, textAlign: "center", padding: "6px 12px", flexShrink: 0 }}>
        {t.demo}
      </div>
    </div>
  );
}

/* ============================================================
   Office desk — where new knowledge volumes are dropped in
   ============================================================ */

function Office({ t, lang, kb, persist }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [body, setBody] = useState("");
  const [stage, setStage] = useState(-1); // -1 idle, 0..2 working
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function addVolume() {
    if (!body.trim()) { setErr(t.empty); return; }
    setErr("");
    setResult(null);
    setStage(0);

    // The desk reads the new volume and works out how to talk about it.
    const system = `You prepare new material for a Nepali government help desk so it can answer citizens' questions from it.
Read the procedure text and reply with ONLY a JSON object, no markdown fences, no commentary:
{"title":"short English title, max 8 words","titleNe":"same title in Nepali Devanagari","cat":"one of: Identity, Travel, Transport, Vital events, Tax, Land, Welfare, Business, Education, Health, Other","keywords":["12-18 lowercase search terms a citizen might type, mixing English, Devanagari Nepali and Roman-script Nepali"],"samples":[{"en":"a question a citizen would ask, English","ne":"same question in Devanagari Nepali","rom":"same question in Roman-script Nepali"},{...},{...}]}
Give exactly 3 sample questions, each answerable from this text alone.`;

    let meta = null;
    try {
      setTimeout(() => setStage(1), 700);
      const raw = await callClaude(
        [{ role: "user", content: `${title ? "Suggested title: " + title + "\n\n" : ""}${body.slice(0, 6000)}` }],
        system,
        900
      );
      meta = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (e) {
      meta = null;
    }

    setStage(2);

    const fallbackKw = [...new Set(tokenize(`${title} ${cat} ${body}`))].slice(0, 16);
    const vol = {
      id: "v-" + Date.now(),
      added: true,
      title: title.trim() || meta?.title || "Untitled volume",
      titleNe: meta?.titleNe || title.trim() || "नयाँ खण्ड",
      cat: cat.trim() || meta?.cat || "Other",
      keywords: meta?.keywords?.length ? meta.keywords : fallbackKw,
      samples: meta?.samples || [],
      body: body.trim(),
    };

    await persist([...kb, vol]);
    setResult(vol);
    setStage(-1);
    setTitle(""); setCat(""); setBody("");
  }

  async function remove(id) {
    await persist(kb.filter((v) => v.id !== id));
  }

  const field = {
    width: "100%", padding: "10px 12px", border: `1px solid ${C.rule}`, borderRadius: 2,
    background: "#fff", color: C.ink, fontSize: 15, marginTop: 5,
  };
  const label = { fontSize: 13, color: C.inkSoft };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F7F7F3" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "22px 18px 40px" }}>
        <h2 style={{ fontFamily: "Khand, Mukta, sans-serif", fontSize: 27, margin: "0 0 6px", fontWeight: 600, color: C.ink }}>
          {t.adminTitle}
        </h2>
        <p style={{ margin: "0 0 22px", color: C.inkSoft, lineHeight: 1.7, maxWidth: "62ch" }}>{t.adminSub}</p>

        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderTop: `3px solid ${C.brass}`, padding: 18, borderRadius: 2 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 230px" }}>
              <span style={label}>{t.volTitle}</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={field} placeholder="Vehicle tax renewal" />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <span style={label}>{t.volCat}</span>
              <input value={cat} onChange={(e) => setCat(e.target.value)} style={field} placeholder="Transport" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={label}>{t.volBody}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              style={{ ...field, resize: "vertical", lineHeight: 1.6, fontSize: 14.5 }}
              placeholder={"Office: …\nDocuments to bring:\n- …\nFee: …\nTime: …"}
            />
          </div>

          {err && <div style={{ color: C.sindoor, fontSize: 13.5, marginTop: 10 }}>{err}</div>}

          <button
            onClick={addVolume}
            disabled={stage >= 0}
            style={{
              marginTop: 14, background: stage >= 0 ? C.rule : C.ink, color: "#fff", border: "none",
              padding: "11px 20px", borderRadius: 2, fontSize: 15, fontWeight: 600,
              cursor: stage >= 0 ? "default" : "pointer",
            }}
          >
            {t.addVol}
          </button>

          {stage >= 0 && (
            <div style={{ marginTop: 16, borderTop: `1px dashed ${C.rule}`, paddingTop: 14 }}>
              {t.indexing.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "4px 0", fontSize: 14, color: i <= stage ? C.ink : "#B9BFB2" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: i < stage ? C.green : i === stage ? C.brass : C.rule, flexShrink: 0 }} className={i === stage ? "ss-pulse" : ""} />
                  {s}
                </div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 16, background: `${C.green}0D`, border: `1px solid ${C.green}33`, padding: 14, borderRadius: 2 }}>
              <div style={{ fontWeight: 700, color: C.green, marginBottom: 4 }}>
                {t.ready} — {result.title}
              </div>
              {result.samples?.length > 0 && (
                <>
                  <div style={{ fontSize: 13, color: C.inkSoft, margin: "8px 0 5px" }}>{t.nowAnswers}</div>
                  {result.samples.map((s, i) => (
                    <div key={i} style={{ fontSize: 14, color: C.ink, padding: "3px 0", lineHeight: 1.55 }}>
                      — {s[lang] || s.en}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ margin: "26px 0 10px", fontSize: 13, color: C.inkSoft }}>
          {kb.length} {t.inLibrary}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {kb.map((v) => (
            <div key={v.id} style={{ background: C.card, border: `1px solid ${C.rule}`, borderLeft: `3px solid ${v.added ? C.brass : C.rule}`, padding: "11px 14px", borderRadius: 2, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: C.ink, fontWeight: 600 }}>{lang === "ne" ? v.titleNe : v.title}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                  {v.cat} · {(v.keywords || []).length} search terms
                </div>
              </div>
              {v.added && (
                <button onClick={() => remove(v.id)} style={{ background: "none", border: `1px solid ${C.rule}`, color: C.inkSoft, fontSize: 12.5, padding: "4px 9px", borderRadius: 2, cursor: "pointer", flexShrink: 0 }}>
                  {t.remove}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
