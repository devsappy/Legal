// Generates eval/questions.json: one question per (topic × jurisdiction × language).
// Expected sections come from the ingested Acts' headings (see corpus/), not from memory.
import { writeFileSync } from "node:fs";

const TOPICS = {
  agm: {
    en: "When must the annual general meeting be held and what business does it transact?",
    hi: "वार्षिक आम सभा कब बुलानी होती है और उसमें कौन-सा कार्य होता है?",
    mr: "वार्षिक सर्वसाधारण सभा कधी घ्यावी लागते आणि तिच्यात कोणते कामकाज होते?",
    ta: "ஆண்டுப் பொதுக்கூட்டம் எப்போது நடத்த வேண்டும், அதில் என்ன விஷயங்கள் நடக்கும்?",
    expect: { central: ["§39"], maharashtra: ["§75"], gujarat: ["§77"], karnataka: ["§27"], "tamil-nadu": ["§32"] },
  },
  sgm: {
    en: "Who can call a special general meeting and within what time?",
    hi: "विशेष आम सभा कौन बुला सकता है और कितने समय में?",
    mr: "विशेष सर्वसाधारण सभा कोण बोलावू शकते आणि किती वेळात?",
    ta: "சிறப்புப் பொதுக்கூட்டத்தை யார், எவ்வளவு காலத்திற்குள் கூட்டலாம்?",
    expect: { central: ["§40"], maharashtra: ["§76"], gujarat: ["§78"], karnataka: ["§28"] },
  },
  registration: {
    en: "How do we apply to register a new cooperative society?",
    hi: "नई सहकारी समिति के पंजीकरण के लिए आवेदन कैसे करें?",
    mr: "नवीन सहकारी संस्थेच्या नोंदणीसाठी अर्ज कसा करावा?",
    ta: "புதிய கூட்டுறவுச் சங்கத்தைப் பதிவு செய்ய எப்படி விண்ணப்பிப்பது?",
    expect: { central: ["§6", "§7"], maharashtra: ["§8", "§9"], karnataka: ["§6", "§7"], "tamil-nadu": ["§8", "§9"] },
  },
  membership: {
    en: "Who is eligible to become a member of a cooperative society?",
    hi: "सहकारी समिति का सदस्य कौन बन सकता है?",
    mr: "सहकारी संस्थेचा सभासद कोण होऊ शकतो?",
    ta: "கூட்டுறவுச் சங்கத்தில் யார் உறுப்பினராகலாம்?",
    expect: { central: ["§25"], maharashtra: ["§22"], karnataka: ["§16"], "tamil-nadu": ["§21"] },
  },
  expulsion: {
    en: "On what grounds can a member be expelled from the society?",
    hi: "किन आधारों पर किसी सदस्य को समिति से निष्कासित किया जा सकता है?",
    mr: "कोणत्या कारणांवरून सभासदाला संस्थेतून काढून टाकता येते?",
    ta: "என்ன காரணங்களுக்காக ஒரு உறுப்பினரைச் சங்கத்திலிருந்து நீக்கலாம்?",
    expect: { central: ["§30"], maharashtra: ["§35"], gujarat: ["§36"], "tamil-nadu": ["§25"] },
  },
  bylaws: {
    en: "How are the bye-laws of a society amended?",
    hi: "समिति के उपनियमों में संशोधन कैसे किया जाता है?",
    mr: "संस्थेच्या उपविधींमध्ये सुधारणा कशी केली जाते?",
    ta: "சங்கத்தின் துணைவிதிகள் எப்படித் திருத்தப்படுகின்றன?",
    expect: { central: ["§11", "§12"], maharashtra: ["§13"], karnataka: ["§12"] },
  },
  audit: {
    en: "Who audits the accounts of the society and how often?",
    hi: "समिति के खातों का ऑडिट कौन करता है और कितनी बार?",
    mr: "संस्थेच्या हिशेबांचे लेखापरीक्षण कोण करते आणि किती वेळा?",
    ta: "சங்கத்தின் கணக்குகளை யார், எவ்வளவு அடிக்கடி தணிக்கை செய்கிறார்?",
    expect: { central: ["§70", "§73"], maharashtra: ["§81"], karnataka: ["§63"], "tamil-nadu": ["§80"] },
  },
  disputes: {
    en: "Where do I take a dispute between a member and the managing committee?",
    hi: "सदस्य और प्रबंध समिति के बीच विवाद कहाँ ले जाऊँ?",
    mr: "सभासद आणि व्यवस्थापक समितीमधील वाद कुठे न्यावा?",
    ta: "ஒரு உறுப்பினருக்கும் நிர்வாகக் குழுவுக்கும் இடையிலான தகராறை எங்கே கொண்டு செல்வது?",
    expect: { central: ["§84"], maharashtra: ["§91"], gujarat: ["§96", "§98"], karnataka: ["§70"], "tamil-nadu": ["§90"] },
  },
  winding: {
    en: "When can the Registrar order a society to be wound up?",
    hi: "रजिस्ट्रार किसी समिति के परिसमापन का आदेश कब दे सकता है?",
    mr: "निबंधक संस्थेच्या अवसायनाचा आदेश कधी देऊ शकतो?",
    ta: "பதிவாளர் ஒரு சங்கத்தைக் கலைக்க எப்போது உத்தரவிடலாம்?",
    expect: { central: ["§86"], maharashtra: ["§102"], gujarat: ["§107"], karnataka: ["§72"], "tamil-nadu": ["§137"] },
  },
};

const questions = [];
for (const [topic, t] of Object.entries(TOPICS)) {
  for (const [jurisdiction, expect] of Object.entries(t.expect)) {
    for (const lang of ["en", "hi", "mr", "ta"]) {
      questions.push({ id: `${topic}-${jurisdiction}-${lang}`, topic, jurisdiction, lang, question: t[lang], expect });
    }
  }
}
writeFileSync(new URL("./questions.json", import.meta.url), JSON.stringify(questions, null, 2) + "\n");
console.log(`${questions.length} questions written`);
