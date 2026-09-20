import type { Citation } from "./types";

/** Text with per-locale variants; falls back to English. */
export type L = { en: string; hi?: string; mr?: string; ta?: string };

export function pick(text: L, locale: string): string {
  return (text as Record<string, string | undefined>)[locale] ?? text.en;
}

/* ---------------------------------------------------------------------------
   Procedures (checklists). In production these come from /v1/checklists.
   --------------------------------------------------------------------------- */
export type ChecklistStep = {
  title: L;
  detail: L;
  forms?: string[];
  deadline?: L;
  fee?: L;
};

export type Checklist = {
  slug: string;
  title: L;
  summary: L;
  authority: L;
  basis: string[];
  jurisdiction: string;
  steps: ChecklistStep[];
};


/* ---------------------------------------------------------------------------
   Admin: documents, glossary, review queue
   --------------------------------------------------------------------------- */
export type DocumentRow = {
  id: string;
  title: string;
  jurisdiction: string;
  version: string;
  effective: string;
  chunks: number;
  status: "indexed" | "processing" | "superseded" | "failed";
};


export type GlossaryRow = {
  term: string;
  hi: string;
  mr: string;
  ta: string;
  source: string;
};

export const GLOSSARY: GlossaryRow[] = [
  { term: "Quorum", hi: "कोरम / गणपूर्ति", mr: "गणपूर्ती", ta: "குறைந்தபட்ச வருகை", source: "MSCS Act §39" },
  { term: "Registrar", hi: "रजिस्ट्रार / निबंधक", mr: "निबंधक", ta: "பதிவாளர்", source: "MSCS Act §3" },
  { term: "Bylaws", hi: "उपनियम", mr: "उपविधी", ta: "துணைவிதிகள்", source: "MSCS Act §3(d)" },
  { term: "Managing committee", hi: "प्रबंध समिति", mr: "व्यवस्थापक समिती", ta: "நிர்வாகக் குழு", source: "Model bylaws cl. 30" },
  { term: "Share capital", hi: "शेयर पूंजी", mr: "भाग भांडवल", ta: "பங்கு மூலதனம்", source: "MSCS Act §67" },
  { term: "Surplus", hi: "अधिशेष", mr: "नफा / अधिशेष", ta: "உபரி", source: "MSCS Act §63" },
  { term: "Arbitration", hi: "मध्यस्थता", mr: "लवाद", ta: "நடுவர் தீர்ப்பு", source: "MSCS Act §84" },
];

export type QueryRow = {
  id: string;
  question: string;
  language: string;
  confidence: number;
  reason: "low_confidence" | "thumbs_down" | "no_citation";
  asked: string;
};


/* ---------------------------------------------------------------------------
   Mock answer used by /api/mock/chat so the UI runs without the backend.
   --------------------------------------------------------------------------- */
export type MockAnswer = {
  text: L;
  citations: Citation[];
  escalate?: boolean;
  confidence: number;
};

export const MOCK_CITATIONS: Citation[] = [
  {
    id: 1,
    act: "Multi-State Cooperative Societies Act, 2002",
    section: "§39(1)",
    title: "Annual general meeting",
    excerpt: "Every multi-State co-operative society shall, within six months after the close of the corresponding year, call a general meeting of its members…",
    jurisdiction: "central",
    verified: true,
  },
  {
    id: 2,
    act: "Model bylaws (credit societies)",
    section: "cl. 24(3)",
    title: "Quorum for general meetings",
    excerpt: "One-fifth of the total number of members or twenty-five members, whichever is less, shall form the quorum for a general meeting.",
    jurisdiction: "central",
    verified: true,
  },
  {
    id: 3,
    act: "Multi-State Cooperative Societies Act, 2002",
    section: "§40",
    title: "Special general meeting",
    excerpt: "The chief executive may at any time, on the direction of the board, call a special general meeting…",
    jurisdiction: "central",
    verified: false,
  },
];

export const MOCK_ANSWER: MockAnswer = {
  confidence: 0.83,
  text: {
    en: "The Act itself does not fix a number — it leaves the quorum for the annual general meeting to the society's bylaws [2]. What the Act does fix is the timing: the AGM must be called within six months of the close of the financial year [1].\n\nUnder the model bylaws most credit societies adopt, the quorum is one-fifth of the total membership or 25 members, whichever is less [2]. If quorum is not present within the time allowed, the meeting is adjourned and the adjourned meeting can proceed without quorum, but only for the original agenda.\n\nCheck your own registered bylaws first; if they set a different figure, that figure applies [3].",
    hi: "अधिनियम स्वयं कोई संख्या तय नहीं करता — वह वार्षिक आम सभा का कोरम समिति के उपनियमों पर छोड़ता है [2]। अधिनियम जो तय करता है वह समय है: आम सभा वित्तीय वर्ष समाप्त होने के छह महीने के भीतर बुलानी होगी [1]।\n\nअधिकांश ऋण समितियाँ जो मॉडल उपनियम अपनाती हैं, उनके अनुसार कोरम कुल सदस्यता का पाँचवाँ हिस्सा या 25 सदस्य, जो भी कम हो [2]। तय समय में कोरम न हो तो सभा स्थगित होती है और स्थगित सभा बिना कोरम के चल सकती है, लेकिन केवल मूल एजेंडा पर।\n\nपहले अपने पंजीकृत उपनियम देखें; यदि उनमें अलग संख्या है तो वही लागू होगी [3]।",
    mr: "कायदा स्वतः कोणतीही संख्या ठरवत नाही — वार्षिक सर्वसाधारण सभेची गणपूर्ती संस्थेच्या उपविधींवर सोडतो [2]. कायदा जे ठरवतो ते म्हणजे वेळ: सभा आर्थिक वर्ष संपल्यानंतर सहा महिन्यांच्या आत बोलावली पाहिजे [1].\n\nबहुतेक पतसंस्था स्वीकारतात त्या आदर्श उपविधींनुसार गणपूर्ती एकूण सभासदांच्या एक-पंचमांश किंवा 25 सभासद, यापैकी जे कमी असेल ते [2]. ठरलेल्या वेळेत गणपूर्ती न झाल्यास सभा तहकूब होते आणि तहकूब सभा गणपूर्तीशिवाय चालू शकते, पण फक्त मूळ विषयपत्रिकेवर.\n\nआधी तुमचे नोंदणीकृत उपविधी पाहा; त्यात वेगळी संख्या असेल तर तीच लागू होईल [3].",
    ta: "சட்டம் தானாக எண்ணிக்கையை நிர்ணயிக்கவில்லை — ஆண்டுப் பொதுக்கூட்டத்திற்கான குறைந்தபட்ச வருகையைச் சங்கத்தின் துணைவிதிகளுக்கு விட்டுள்ளது [2]. சட்டம் நிர்ணயிப்பது காலம்: நிதியாண்டு முடிந்த ஆறு மாதங்களுக்குள் கூட்டம் கூட்டப்பட வேண்டும் [1].\n\nபெரும்பாலான கடன் சங்கங்கள் ஏற்கும் மாதிரித் துணைவிதிகளின்படி, மொத்த உறுப்பினர்களில் ஐந்தில் ஒரு பங்கு அல்லது 25 உறுப்பினர்கள், எது குறைவோ அது [2]. குறிப்பிட்ட நேரத்தில் வருகை இல்லாவிட்டால் கூட்டம் ஒத்திவைக்கப்படும்; ஒத்திவைக்கப்பட்ட கூட்டம் குறைந்தபட்ச வருகை இல்லாமலும் நடக்கலாம், ஆனால் அசல் நிகழ்ச்சி நிரலுக்கு மட்டும்.\n\nமுதலில் உங்கள் பதிவு செய்யப்பட்ட துணைவிதிகளைப் பாருங்கள்; வேறு எண் இருந்தால் அதுவே பொருந்தும் [3].",
  },
  citations: MOCK_CITATIONS,
};
