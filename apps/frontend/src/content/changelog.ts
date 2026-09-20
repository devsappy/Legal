import type { L } from "@sahayak/shared";

/**
 * What changed, newest first. Rendered on /changelog and in the shell's
 * "What's new" drawer; LATEST_CHANGELOG_ID is compared with the stored
 * coop.changelog.seen to show the unread dot. Copy is per locale (pick()).
 */
export type ChangelogTag = "new" | "improved" | "fixed";

export type ChangelogEntry = {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tag: ChangelogTag;
  title: L;
  body: L;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-09-20-workspace",
    date: "2026-09-20",
    tag: "new",
    title: {
      en: "A home page, settings and a status page",
      hi: "होम पेज, सेटिंग्स और स्टेटस पेज",
      mr: "होम पेज, सेटिंग्ज आणि स्टेटस पेज",
      ta: "முகப்புப் பக்கம், அமைப்புகள் மற்றும் நிலைப் பக்கம்",
    },
    body: {
      en: "Signed-in users now land on Home with recent conversations, procedure progress and the state of the service. Settings holds your profile, language, Act and motion preferences. Keyboard shortcuts, a command palette (Ctrl/⌘ K), undo for deletions and a public status page round it out.",
      hi: "साइन इन करने पर अब आप होम पर पहुँचते हैं, जहाँ हाल की बातचीत, प्रक्रियाओं की प्रगति और सेवा की स्थिति दिखती है। सेटिंग्स में प्रोफ़ाइल, भाषा, अधिनियम और मोशन की पसंद रखी गई है। कीबोर्ड शॉर्टकट, कमांड पैलेट (Ctrl/⌘ K), हटाने पर पूर्ववत करने का विकल्प और एक सार्वजनिक स्टेटस पेज भी जोड़े गए हैं।",
      mr: "साइन इन केल्यावर आता तुम्ही होमवर पोहोचता, जिथे अलीकडील संभाषणे, प्रक्रियांची प्रगती आणि सेवेची स्थिती दिसते. सेटिंग्जमध्ये प्रोफाइल, भाषा, अधिनियम आणि मोशनची पसंत ठेवली आहे. कीबोर्ड शॉर्टकट, कमांड पॅलेट (Ctrl/⌘ K), हटवल्यावर पूर्ववत करण्याचा पर्याय आणि सार्वजनिक स्टेटस पेजही जोडले आहेत.",
      ta: "உள்நுழைந்தவுடன் இப்போது முகப்புப் பக்கத்திற்குச் செல்கிறீர்கள்; அங்கே சமீபத்திய உரையாடல்கள், நடைமுறைகளின் முன்னேற்றம் மற்றும் சேவையின் நிலை காணலாம். அமைப்புகளில் சுயவிவரம், மொழி, சட்டம் மற்றும் அசைவு விருப்பங்கள் உள்ளன. விசைப்பலகை குறுக்குவழிகள், கட்டளைப் பலகம் (Ctrl/⌘ K), நீக்கியதைச் செயல்தவிர்க்கும் வசதி மற்றும் பொது நிலைப் பக்கமும் சேர்க்கப்பட்டுள்ளன.",
    },
  },
  {
    id: "2026-09-19-evaluation",
    date: "2026-09-19",
    tag: "improved",
    title: {
      en: "Retrieval tuned and measured in all four languages",
      hi: "चारों भाषाओं में खोज बेहतर और मापी गई",
      mr: "चारही भाषांमध्ये शोध सुधारला आणि मोजला",
      ta: "நான்கு மொழிகளிலும் தேடல் மேம்படுத்தப்பட்டு அளவிடப்பட்டது",
    },
    body: {
      en: "A 152-question evaluation set (nine topics across the Acts, in English, Hindi, Marathi and Tamil) now runs against the assistant. In the latest run the right section was retrieved for 89–100% of questions depending on the language, and every answer came back in the language it was asked in. Citations the verification pass cannot confirm are marked unverified and sent to the review queue.",
      hi: "अब 152 प्रश्नों का मूल्यांकन सेट (अधिनियमों के नौ विषय, अंग्रेज़ी, हिन्दी, मराठी और तमिल में) सहायक पर चलाया जाता है। ताज़ा दौर में भाषा के अनुसार 89–100% प्रश्नों के लिए सही धारा खोजी गई, और हर उत्तर उसी भाषा में मिला जिसमें प्रश्न पूछा गया था। जिन उद्धरणों की पुष्टि नहीं हो पाती, उन्हें असत्यापित चिह्नित कर समीक्षा कतार में भेजा जाता है।",
      mr: "आता 152 प्रश्नांचा मूल्यमापन संच (अधिनियमांतील नऊ विषय, इंग्रजी, हिंदी, मराठी आणि तमिळमध्ये) सहाय्यकावर चालवला जातो. ताज्या फेरीत भाषेनुसार 89–100% प्रश्नांसाठी योग्य कलम शोधले गेले, आणि प्रत्येक उत्तर ज्या भाषेत प्रश्न विचारला त्याच भाषेत मिळाले. ज्या संदर्भांची पडताळणी होऊ शकत नाही ते असत्यापित म्हणून चिन्हांकित करून पुनरावलोकन रांगेत पाठवले जातात.",
      ta: "இப்போது 152 கேள்விகள் கொண்ட மதிப்பீட்டுத் தொகுப்பு (சட்டங்களின் ஒன்பது தலைப்புகள், ஆங்கிலம், இந்தி, மராத்தி மற்றும் தமிழில்) உதவியாளரில் இயக்கப்படுகிறது. சமீபத்திய சுற்றில் மொழியைப் பொறுத்து 89–100% கேள்விகளுக்குச் சரியான பிரிவு மீட்டெடுக்கப்பட்டது; ஒவ்வொரு பதிலும் கேட்கப்பட்ட மொழியிலேயே வந்தது. சரிபார்ப்பில் உறுதிப்படுத்த முடியாத மேற்கோள்கள் சரிபார்க்கப்படாதவை எனக் குறிக்கப்பட்டு மதிப்பாய்வு வரிசைக்கு அனுப்பப்படுகின்றன.",
    },
  },
  {
    id: "2026-09-18-languages",
    date: "2026-09-18",
    tag: "new",
    title: {
      en: "Hindi, Marathi and Tamil, with voice",
      hi: "हिन्दी, मराठी और तमिल, आवाज़ के साथ",
      mr: "हिंदी, मराठी आणि तमिळ, आवाजासह",
      ta: "இந்தி, மராத்தி மற்றும் தமிழ், குரல் வசதியுடன்",
    },
    body: {
      en: "The whole interface and the answers are available in four languages. Questions can be spoken as well as typed, answers can be read aloud, and a shared glossary keeps legal terms consistent whichever language you use.",
      hi: "पूरा इंटरफ़ेस और उत्तर अब चार भाषाओं में उपलब्ध हैं। प्रश्न टाइप करने के साथ बोलकर भी पूछे जा सकते हैं, उत्तर सुने जा सकते हैं, और एक साझा शब्दावली हर भाषा में कानूनी शब्दों को एक जैसा रखती है।",
      mr: "संपूर्ण इंटरफेस आणि उत्तरे आता चार भाषांमध्ये उपलब्ध आहेत. प्रश्न टाइप करण्यासोबत बोलूनही विचारता येतात, उत्तरे ऐकता येतात, आणि एक सामायिक शब्दसंग्रह प्रत्येक भाषेत कायदेशीर संज्ञा एकसारख्या ठेवतो.",
      ta: "முழு இடைமுகமும் பதில்களும் இப்போது நான்கு மொழிகளில் கிடைக்கின்றன. கேள்விகளைத் தட்டச்சு செய்வதோடு பேசியும் கேட்கலாம், பதில்களைக் கேட்கலாம்; பகிரப்பட்ட சொற்களஞ்சியம் எந்த மொழியிலும் சட்டச் சொற்களை ஒரே மாதிரியாக வைத்திருக்கிறது.",
    },
  },
];

export const LATEST_CHANGELOG_ID: string = CHANGELOG[0].id;
