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

export const CHECKLISTS: Checklist[] = [
  {
    slug: "register-society",
    title: { en: "Register a new cooperative society", hi: "नई सहकारी समिति पंजीकृत करें", mr: "नवीन सहकारी संस्था नोंदणी करा", ta: "புதிய கூட்டுறவுச் சங்கம் பதிவு செய்தல்" },
    summary: { en: "From the first promoters' meeting to the certificate of registration.", hi: "पहली प्रवर्तक बैठक से पंजीकरण प्रमाणपत्र तक।", mr: "पहिल्या प्रवर्तक सभेपासून नोंदणी प्रमाणपत्रापर्यंत.", ta: "முதல் முன்னோடிக் கூட்டம் முதல் பதிவுச் சான்றிதழ் வரை." },
    authority: { en: "Central Registrar of Cooperative Societies", hi: "केंद्रीय रजिस्ट्रार, सहकारी समितियाँ" },
    basis: ["MSCS Act 2002 §6", "MSCS Act 2002 §7", "MSCS Rules 2002 r.3"],
    jurisdiction: "central",
    steps: [
      { title: { en: "Hold a promoters' meeting", hi: "प्रवर्तकों की बैठक करें" }, detail: { en: "At least 50 individual members from two or more states, or five cooperative societies. Record the resolution to form the society and to adopt draft bylaws.", hi: "दो या अधिक राज्यों से कम से कम 50 व्यक्तिगत सदस्य, या पाँच सहकारी समितियाँ। समिति बनाने और प्रारूप उपनियम अपनाने का संकल्प दर्ज करें।" } },
      { title: { en: "Prepare the application", hi: "आवेदन तैयार करें" }, detail: { en: "Application signed by at least 50 members (or the authorised representatives of member societies), with four copies of the proposed bylaws.", hi: "कम से कम 50 सदस्यों द्वारा हस्ताक्षरित आवेदन, प्रस्तावित उपनियमों की चार प्रतियों के साथ।" }, forms: ["Form I", "Bylaws (4 copies)"] },
      { title: { en: "Attach the scheme and financials", hi: "योजना और वित्तीय विवरण संलग्न करें" }, detail: { en: "Scheme showing economic soundness, the proposed area of operation, and a certificate from the bank about the share capital collected.", hi: "आर्थिक व्यवहार्यता दर्शाने वाली योजना, प्रस्तावित कार्यक्षेत्र, और एकत्रित शेयर पूंजी के बारे में बैंक प्रमाणपत्र।" }, forms: ["Bank certificate", "Feasibility scheme"] },
      { title: { en: "Submit to the Central Registrar", hi: "केंद्रीय रजिस्ट्रार को जमा करें" }, detail: { en: "File in person or by post with the prescribed fee. Keep the acknowledgement.", hi: "निर्धारित शुल्क के साथ व्यक्तिगत रूप से या डाक से जमा करें। पावती संभाल कर रखें।" }, fee: { en: "As notified by the Central Government", hi: "केंद्र सरकार द्वारा अधिसूचित" } },
      { title: { en: "Respond to queries", hi: "प्रश्नों का उत्तर दें" }, detail: { en: "The Registrar must decide within four months. If the application is deficient, reply within the time given in the notice.", hi: "रजिस्ट्रार को चार महीने के भीतर निर्णय लेना होगा। आवेदन में कमी हो तो नोटिस में दिए समय में जवाब दें।" }, deadline: { en: "Registrar decides within 4 months of receipt", hi: "प्राप्ति के 4 महीने के भीतर रजिस्ट्रार का निर्णय" } },
      { title: { en: "Collect the certificate", hi: "प्रमाणपत्र प्राप्त करें" }, detail: { en: "The certificate of registration is conclusive evidence that the society is registered. Enter it in the first board meeting minutes.", hi: "पंजीकरण प्रमाणपत्र इस बात का निर्णायक प्रमाण है कि समिति पंजीकृत है। इसे पहली बोर्ड बैठक के कार्यवृत्त में दर्ज करें।" } },
    ],
  },
  {
    slug: "conduct-election",
    title: { en: "Conduct board elections", hi: "बोर्ड चुनाव कराएँ", mr: "संचालक मंडळ निवडणूक घ्या", ta: "நிர்வாகக் குழுத் தேர்தல் நடத்துதல்" },
    summary: { en: "Timelines and notices for electing the board before the current term ends.", hi: "वर्तमान कार्यकाल समाप्त होने से पहले बोर्ड चुनाव की समय-सीमा और सूचनाएँ।" },
    authority: { en: "Returning officer appointed by the outgoing board", hi: "निवर्तमान बोर्ड द्वारा नियुक्त निर्वाचन अधिकारी" },
    basis: ["MSCS Act 2002 §45", "MSCS Rules 2002 r.19"],
    jurisdiction: "central",
    steps: [
      { title: { en: "Fix the election date", hi: "चुनाव की तारीख तय करें" }, detail: { en: "The election must be held before the expiry of the board's five-year term. The outgoing board conducts it.", hi: "चुनाव बोर्ड के पाँच वर्ष के कार्यकाल की समाप्ति से पहले होना चाहिए। निवर्तमान बोर्ड इसे कराता है।" }, deadline: { en: "Before the current term expires", hi: "वर्तमान कार्यकाल समाप्त होने से पहले" } },
      { title: { en: "Publish the voter list", hi: "मतदाता सूची प्रकाशित करें" }, detail: { en: "Prepare the list of members eligible to vote and display it at the registered office. Allow objections.", hi: "मतदान योग्य सदस्यों की सूची तैयार करें और पंजीकृत कार्यालय में प्रदर्शित करें। आपत्तियों का अवसर दें।" } },
      { title: { en: "Issue the election notice", hi: "चुनाव सूचना जारी करें" }, detail: { en: "Notice to all members stating the date, place, number of seats and reserved seats.", hi: "सभी सदस्यों को तारीख, स्थान, सीटों की संख्या और आरक्षित सीटें बताते हुए सूचना।" }, forms: ["Election notice"] },
      { title: { en: "Nominations and scrutiny", hi: "नामांकन और जाँच" }, detail: { en: "Receive nomination papers, scrutinise them, publish the final list of candidates.", hi: "नामांकन पत्र प्राप्त करें, जाँच करें, उम्मीदवारों की अंतिम सूची प्रकाशित करें।" }, forms: ["Nomination form"] },
      { title: { en: "Poll and counting", hi: "मतदान और गिनती" }, detail: { en: "Conduct the poll by secret ballot, count in presence of candidates or agents, declare results.", hi: "गुप्त मतदान कराएँ, उम्मीदवारों या उनके एजेंटों की उपस्थिति में गिनती करें, परिणाम घोषित करें।" } },
      { title: { en: "File the return", hi: "विवरणी दाखिल करें" }, detail: { en: "Send the list of elected members to the Registrar within the prescribed period.", hi: "निर्वाचित सदस्यों की सूची निर्धारित अवधि में रजिस्ट्रार को भेजें।" }, deadline: { en: "Within 15 days of the result", hi: "परिणाम के 15 दिनों के भीतर" } },
    ],
  },
  {
    slug: "annual-general-meeting",
    title: { en: "Call the annual general meeting", hi: "वार्षिक आम सभा बुलाएँ", mr: "वार्षिक सर्वसाधारण सभा बोलवा", ta: "ஆண்டுப் பொதுக்கூட்டம் கூட்டுதல்" },
    summary: { en: "Notice period, quorum and the business every AGM must transact.", hi: "सूचना अवधि, कोरम और हर आम सभा में होने वाला अनिवार्य कार्य।" },
    authority: { en: "Board of the society", hi: "समिति का बोर्ड" },
    basis: ["MSCS Act 2002 §39", "Model bylaws cl. 24"],
    jurisdiction: "central",
    steps: [
      { title: { en: "Fix the date", hi: "तारीख तय करें" }, detail: { en: "The AGM must be held within six months of the close of the financial year.", hi: "आम सभा वित्तीय वर्ष समाप्त होने के छह महीने के भीतर होनी चाहिए।" }, deadline: { en: "By 30 September", hi: "30 सितंबर तक" } },
      { title: { en: "Send notice", hi: "सूचना भेजें" }, detail: { en: "At least 14 clear days' notice to every member, with the agenda, audited accounts and the board's report.", hi: "हर सदस्य को कम से कम 14 स्पष्ट दिनों की सूचना, एजेंडा, लेखापरीक्षित खाते और बोर्ड की रिपोर्ट के साथ।" }, forms: ["AGM notice", "Annual report"] },
      { title: { en: "Confirm quorum", hi: "कोरम की पुष्टि करें" }, detail: { en: "Check the quorum in the bylaws before starting. If not met within the time allowed, adjourn as the bylaws provide.", hi: "शुरू करने से पहले उपनियमों में कोरम जाँचें। तय समय में कोरम पूरा न हो तो उपनियमों के अनुसार स्थगित करें।" } },
      { title: { en: "Transact the mandatory business", hi: "अनिवार्य कार्य करें" }, detail: { en: "Consider the audit report, approve the accounts, decide the distribution of surplus, appoint the auditor.", hi: "लेखापरीक्षा रिपोर्ट पर विचार करें, खाते अनुमोदित करें, अधिशेष वितरण तय करें, लेखापरीक्षक नियुक्त करें।" } },
      { title: { en: "Record and file", hi: "दर्ज करें और दाखिल करें" }, detail: { en: "Write the minutes, get them signed, and file the annual return with the Registrar.", hi: "कार्यवृत्त लिखें, हस्ताक्षर कराएँ, और रजिस्ट्रार को वार्षिक विवरणी दाखिल करें।" }, forms: ["Annual return"] },
    ],
  },
  {
    slug: "raise-dispute",
    title: { en: "Raise a dispute against the board", hi: "बोर्ड के खिलाफ विवाद उठाएँ", mr: "मंडळाविरुद्ध वाद दाखल करा", ta: "நிர்வாகக் குழுவுக்கு எதிராகத் தகராறு எழுப்புதல்" },
    summary: { en: "How a member takes a grievance to arbitration under the Act.", hi: "कोई सदस्य अधिनियम के तहत शिकायत को मध्यस्थता तक कैसे ले जाए।" },
    authority: { en: "Central Registrar / Arbitrator", hi: "केंद्रीय रजिस्ट्रार / मध्यस्थ" },
    basis: ["MSCS Act 2002 §84", "Arbitration and Conciliation Act 1996"],
    jurisdiction: "central",
    steps: [
      { title: { en: "Check the dispute is covered", hi: "जाँचें कि विवाद दायरे में है" }, detail: { en: "Disputes touching the constitution, management or business of the society between a member and the society or its board are referred to arbitration.", hi: "समिति के गठन, प्रबंधन या कारोबार से जुड़े सदस्य और समिति या बोर्ड के बीच के विवाद मध्यस्थता को भेजे जाते हैं।" } },
      { title: { en: "Write to the board first", hi: "पहले बोर्ड को लिखें" }, detail: { en: "Give the board a written chance to resolve it. Keep proof of delivery.", hi: "बोर्ड को लिखित रूप में हल करने का अवसर दें। डिलीवरी का प्रमाण रखें।" } },
      { title: { en: "Apply to the Registrar", hi: "रजिस्ट्रार को आवेदन करें" }, detail: { en: "File the reference with the facts, the relief sought, and copies of correspondence.", hi: "तथ्यों, माँगी गई राहत और पत्राचार की प्रतियों के साथ संदर्भ दाखिल करें।" }, forms: ["Dispute reference"], deadline: { en: "Within the limitation period for the claim", hi: "दावे की परिसीमा अवधि के भीतर" } },
      { title: { en: "Arbitration", hi: "मध्यस्थता" }, detail: { en: "The Registrar refers it to an arbitrator. Attend hearings; the award is binding subject to appeal.", hi: "रजिस्ट्रार इसे मध्यस्थ को भेजता है। सुनवाई में उपस्थित रहें; निर्णय अपील के अधीन बाध्यकारी है।" } },
    ],
  },
];

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

export const DOCUMENTS: DocumentRow[] = [
  { id: "d1", title: "Multi-State Cooperative Societies Act, 2002", jurisdiction: "central", version: "as amended 2023", effective: "2023-08-03", chunks: 412, status: "indexed" },
  { id: "d2", title: "Multi-State Cooperative Societies Rules, 2002", jurisdiction: "central", version: "2002", effective: "2002-08-19", chunks: 138, status: "indexed" },
  { id: "d3", title: "Maharashtra Cooperative Societies Act, 1960", jurisdiction: "maharashtra", version: "as amended 2019", effective: "2019-03-09", chunks: 587, status: "indexed" },
  { id: "d4", title: "Model bylaws for credit cooperative societies", jurisdiction: "central", version: "2021", effective: "2021-01-01", chunks: 96, status: "indexed" },
  { id: "d5", title: "Tamil Nadu Cooperative Societies Act, 1983", jurisdiction: "tamil-nadu", version: "1983", effective: "1988-04-01", chunks: 0, status: "processing" },
  { id: "d6", title: "Multi-State Cooperative Societies Act, 2002", jurisdiction: "central", version: "2002 (original)", effective: "2002-08-19", chunks: 380, status: "superseded" },
];

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

export const QUERIES: QueryRow[] = [
  { id: "q1", question: "Can a nominal member vote in the AGM?", language: "en", confidence: 0.41, reason: "low_confidence", asked: "2026-09-17T10:12:00Z" },
  { id: "q2", question: "बोर्ड की बैठक का कोरम कितना है?", language: "hi", confidence: 0.78, reason: "thumbs_down", asked: "2026-09-17T08:03:00Z" },
  { id: "q3", question: "संचालक मंडळ बरखास्त करण्याची प्रक्रिया काय आहे?", language: "mr", confidence: 0.36, reason: "no_citation", asked: "2026-09-16T15:47:00Z" },
  { id: "q4", question: "இணைப்புச் சங்கத்திற்கு தணிக்கை கட்டாயமா?", language: "ta", confidence: 0.52, reason: "low_confidence", asked: "2026-09-16T11:20:00Z" },
];

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
