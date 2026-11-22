import { useEffect } from 'react';

// Interface-only translations. Backend eligibility responses remain in English.
const translations = {
 'Discover':'కనుగొనండి','Scheme library':'పథకాల జాబితా','My applications':'నా దరఖాస్తులు','Deadlines':'గడువులు',
 'Find support. Move forward.':'సహాయం పొందండి. ముందుకు సాగండి.',
 'Ask SchemeSathi':'స్కీమ్‌సాథిని అడగండి','Write naturally, just like you\'re talking to someone.':'మీ వివరాలను సహజంగా రాయండి.',
 'Describe your situation':'మీ పరిస్థితిని వివరించండి','Telugu help':'తెలుగు సహాయం','Hide Telugu help':'తెలుగు సహాయం దాచండి',
 'Sample profile':'నమూనా వివరాలు','How are you studying?':'మీరు ఎలా చదువుతున్నారు?','How were you admitted?':'మీకు ప్రవేశం ఎలా లభించింది?',
 'Not sure / not provided':'తెలియదు / ఇవ్వలేదు','Regular, full-time':'రెగ్యులర్, పూర్తి సమయం','Part-time':'పార్ట్ టైమ్',
 'Distance / correspondence':'దూరవిద్య / కరస్పాండెన్స్','Online':'ఆన్‌లైన్','Convener / counselling':'కన్వీనర్ / కౌన్సెలింగ్',
 'Management quota':'మేనేజ్‌మెంట్ కోటా','Sponsored seat':'స్పాన్సర్డ్ సీటు','Spot admission':'స్పాట్ అడ్మిషన్',
 'Find my scholarships':'నా స్కాలర్‌షిప్‌లను కనుగొనండి','Checking available rules…':'నిబంధనలను పరిశీలిస్తోంది…',
 'Details understood':'గుర్తించిన వివరాలు','Your details appear here after you describe your situation.':'మీ పరిస్థితిని వివరించిన తర్వాత ఇక్కడ వివరాలు కనిపిస్తాయి.',
 'Annual family income':'కుటుంబ వార్షిక ఆదాయం','Social category':'సామాజిక వర్గం','Residential area':'నివాస ప్రాంతం',
 'Telangana student':'తెలంగాణ విద్యార్థి','Post-secondary education':'ఉన్నత విద్య','Postgraduate study abroad':'విదేశాల్లో పీజీ చదువు',
 'Regular, full-time course':'రెగ్యులర్, పూర్తి సమయ కోర్సు','Eligible admission route':'అర్హతగల ప్రవేశ విధానం',
 'Yes':'అవును','No':'కాదు','urban':'పట్టణ','rural':'గ్రామీణ',
 'How it works':'ఇది ఎలా పనిచేస్తుంది','Tell us about yourself':'మీ గురించి చెప్పండి','We evaluate available scheme rules':'పథకాల నిబంధనలను పరిశీలిస్తాము',
 'Review explanations and documents':'వివరణలు, పత్రాలను చూడండి','Apply through official channels':'అధికారిక మార్గంలో దరఖాస్తు చేయండి',
 'Save your progress later':'మీ పురోగతిని భద్రపరచుకోండి','Go to My applications':'నా దరఖాస్తులకు వెళ్లండి',
 'Your personalized guidance':'మీకు అనుకూలమైన మార్గదర్శకం','Likely scholarship matches':'సరిపడే అవకాశం ఉన్న స్కాలర్‌షిప్‌లు',
 'Scholarship assessment':'స్కాలర్‌షిప్ అంచనా','Likely eligible on checked rules':'పరిశీలించిన నిబంధనల ప్రకారం అర్హత ఉండవచ్చు',
 'More information needed':'మరిన్ని వివరాలు అవసరం','Rules not met':'నిబంధనలు సరిపోలలేదు','Eligibility not verified':'అర్హత ధృవీకరించబడలేదు',
 'View':'చూడండి','Hide':'దాచండి','reasoning and application guidance':'కారణాలు మరియు దరఖాస్తు మార్గదర్శకం',
 'Rule-by-rule explanation':'నిబంధనల వారీ వివరణ','Documents to prepare':'సిద్ధం చేయాల్సిన పత్రాలు','How to apply':'ఎలా దరఖాస్తు చేయాలి',
 'Official source':'అధికారిక మూలం','View official source':'అధికారిక మూలాన్ని చూడండి',
 'No confirmed likely matches yet':'ఇప్పటివరకు నిర్ధారిత సరిపోలికలు లేవు','Why some scholarships do not match':'కొన్ని స్కాలర్‌షిప్‌లు ఎందుకు సరిపోలలేదు',
 'Recorded rules not met':'నమోదైన నిబంధనలు సరిపోలలేదు','A few details will help us narrow this down':'మరికొన్ని వివరాలు అందించండి',
 'View programmes requiring more information':'మరింత సమాచారం అవసరమైన పథకాలు','Scholarship library':'స్కాలర్‌షిప్‌ల జాబితా',
 'Explore scholarships':'స్కాలర్‌షిప్‌లను అన్వేషించండి','Refresh':'రిఫ్రెష్','Official source recorded':'అధికారిక మూలం నమోదు చేయబడింది',
 'Source information':'మూలం సమాచారం','Requirements, documents and application steps':'అర్హతలు, పత్రాలు మరియు దరఖాస్తు దశలు',
 'Visit official portal':'అధికారిక పోర్టల్‌ను సందర్శించండి','Needs Official Confirmation':'అధికారిక నిర్ధారణ అవసరం',
 'Needs official confirmation':'అధికారిక నిర్ధారణ అవసరం','Application Tracker':'దరఖాస్తుల ట్రాకర్',
 'Add Application':'దరఖాస్తు జోడించండి','Select scholarship':'స్కాలర్‌షిప్ ఎంచుకోండి','Add Tracking':'ట్రాకింగ్ జోడించండి',
 'Verified scholarship tracking':'ధృవీకరించిన స్కాలర్‌షిప్ ట్రాకింగ్','Prepare documents':'పత్రాలు సిద్ధం చేయండి',
 'Sign out':'సైన్ అవుట్','Sign in':'సైన్ ఇన్','Create account':'ఖాతా సృష్టించండి',
 'Deadlines and reminders':'గడువులు మరియు రిమైండర్లు','Deadline reminders':'గడువు రిమైండర్లు',
 'Enable in-app reminders':'యాప్‌లో రిమైండర్లు ప్రారంభించండి','Remind me':'నాకు గుర్తు చేయండి',
 '7 days before':'7 రోజుల ముందు','3 days before':'3 రోజుల ముందు','1 day before':'1 రోజు ముందు',
 'Send test notification':'పరీక్ష నోటిఫికేషన్ పంపండి','Upcoming':'రాబోయేది','No verified deadline':'ధృవీకరించిన గడువు లేదు',
 'Programmes Awaiting Official Confirmation':'అధికారిక నిర్ధారణ కోసం వేచి ఉన్న పథకాలు',
 'Documents prepared:':'సిద్ధమైన పత్రాలు:','Next action:':'తదుపరి చర్య:','Deadline:':'గడువు:',
 'Deadline verified:':'గడువు ధృవీకరణ:','Source recorded:':'మూలం నమోదు:','Recorded verification date:':'నమోదైన ధృవీకరణ తేదీ:',
 'Academic year':'విద్యా సంవత్సరం','days left':'రోజులు మిగిలాయి','day(s) remaining':'రోజులు మిగిలాయి',
 'No verified deadline available. Check the official portal.':'ధృవీకరించిన గడువు లేదు. అధికారిక పోర్టల్‌ను చూడండి.',
 'SUBMITTED':'సమర్పించబడింది','DRAFT':'డ్రాఫ్ట్','IN_PROGRESS':'ప్రక్రియలో ఉంది','APPROVED':'ఆమోదించబడింది',
};

// Additional homepage and safety-copy translations.
Object.assign(translations, {
 'SOURCE-BACKED SCHOLARSHIP MATCHING': 'ఆధారాలతో కూడిన స్కాలర్\u200cషిప్ సరిపోలిక',
 'Find the support ': 'మీకు అర్హత ఉన్న ',
 'you qualify for.': 'సహాయాన్ని కనుగొనండి.',
 'Tell us about your education and family circumstances. Discover relevant scholarships, understand the rules, and learn what to do next.': 'మీ విద్య, కుటుంబ పరిస్థితులను వివరించండి. సంబంధిత స్కాలర్\u200cషిప్\u200cలను కనుగొని, నిబంధనలు మరియు తదుపరి దశలను తెలుసుకోండి.',
 'No login required. Never enter Aadhaar, PAN or other identity numbers.': 'లాగిన్ అవసరం లేదు. ఆధార్, పాన్ లేదా ఇతర గుర్తింపు సంఖ్యలను నమోదు చేయవద్దు.',
 "I'm studying B.Tech in Telangana. My family earns ₹1.8 lakh per year...": 'నేను తెలంగాణలో బీటెక్ చదువుతున్నాను. మా కుటుంబ వార్షిక ఆదాయం ₹1.8 లక్షలు...',
 'Optional details. We check these against the specific scholarship rules; they do not guarantee eligibility.': 'ఐచ్ఛిక వివరాలు. వీటిని స్కాలర్\u200cషిప్ నిబంధనలతో పోల్చి చూస్తాము; ఇవి అర్హతకు హామీ ఇవ్వవు.',
 'Scholarship discovery is free to use without signing in. Create an account only when you want to track an application.': 'లాగిన్ కాకుండానే స్కాలర్\u200cషిప్\u200cలను ఉచితంగా వెతకవచ్చు. దరఖాస్తును ట్రాక్ చేయాలనుకున్నప్పుడు మాత్రమే ఖాతా సృష్టించండి.',
 'Browse available programmes and check whether their eligibility rules have been verified.': 'అందుబాటులో ఉన్న పథకాలను చూడండి; వాటి అర్హత నిబంధనలు ధృవీకరించబడ్డాయో తెలుసుకోండి.',
 "Sign in only when you're ready to save and track applications.": 'దరఖాస్తులను సేవ్ చేసి ట్రాక్ చేయాలనుకున్నప్పుడు మాత్రమే లాగిన్ అవ్వండి.',
 'Only verified deadlines should be treated as confirmed. Check official portals before applying.': 'ధృవీకరించిన గడువులను మాత్రమే నిర్ధారితమైనవిగా పరిగణించండి. దరఖాస్తు చేసే ముందు అధికారిక పోర్టల్\u200cను పరిశీలించండి.',
 'SchemeSathi AI · Telangana student pilot · Independent hackathon prototype, not a government service · Never share sensitive ID numbers': 'స్కీమ్\u200cసాథి AI · తెలంగాణ విద్యార్థుల పైలట్ · స్వతంత్ర హ్యాకథాన్ నమూనా, ప్రభుత్వ సేవ కాదు · సున్నితమైన గుర్తింపు సంఖ్యలను పంచుకోవద్దు',
});

// Additional user-facing catalogue, checklist and reminder translations.
Object.assign(translations, {
  "Review programme information and official application sources.": "పథకాల వివరాలు, అధికారిక దరఖాస్తు మూలాలను పరిశీలించండి.",
  "Government of Telangana post-secondary scholarship for eligible students at recognised institutions.": "గుర్తింపు పొందిన విద్యాసంస్థల్లో చదువుతున్న అర్హులైన విద్యార్థులకు తెలంగాణ ప్రభుత్వ ఉన్నత విద్య స్కాలర్‌షిప్.",
  "Eligible tuition-fee reimbursement and maintenance support; amounts depend on course and applicable rules.": "అర్హులైన విద్యార్థులకు ఫీజు రీయింబర్స్‌మెంట్, నిర్వహణ సహాయం లభించవచ్చు. మొత్తం కోర్సు, వర్తించే నిబంధనలపై ఆధారపడి ఉంటుంది.",
  "Telangana overseas postgraduate study support for eligible BC and EBC graduates; confirm current intake with the department.": "అర్హులైన బీసీ, ఈబీసీ పట్టభద్రుల విదేశీ పీజీ చదువులకు తెలంగాణ ప్రభుత్వ సహాయం. ప్రస్తుత దరఖాస్తుల స్వీకరణను శాఖతో నిర్ధారించుకోండి.",
  "Overseas education financial assistance subject to official selection and programme rules.": "అధికారిక ఎంపిక, పథకం నిబంధనలకు లోబడి విదేశీ విద్యకు ఆర్థిక సహాయం.",
  "Full eligibility has not been determined. Income assessment is only one part of the scholarship requirements.": "పూర్తి అర్హత ఇంకా నిర్ధారించబడలేదు. కుటుంబ ఆదాయం స్కాలర్‌షిప్ అర్హతలో ఒక అంశం మాత్రమే.",
  "Named Telangana overseas education programme. Current eligibility criteria have not been independently verified.": "తెలంగాణలో పేర్కొన్న విదేశీ విద్యా పథకం. ప్రస్తుత అర్హత ప్రమాణాలు స్వతంత్రంగా ధృవీకరించబడలేదు.",
  "Potential overseas education assistance; benefit amount and conditions require official confirmation.": "విదేశీ విద్యకు సహాయం లభించే అవకాశం ఉంది. మొత్తం, షరతులను అధికారికంగా నిర్ధారించుకోవాలి.",
  "These are named programmes awaiting verification of eligibility rules, benefits, documents and application instructions. No eligibility determination is available.": "ఈ పథకాల అర్హత నిబంధనలు, ప్రయోజనాలు, పత్రాలు, దరఖాస్తు సూచనలు ఇంకా ధృవీకరించాల్సి ఉంది. ప్రస్తుతం అర్హత నిర్ణయించలేము.",
  "Eligibility rules": "అర్హత నిబంధనలు",
  "Document checklist": "పత్రాల జాబితా",
  "Application steps": "దరఖాస్తు దశలు",
  "Complete eligibility rules are not yet encoded. Refer to the official portal.": "పూర్తి అర్హత నిబంధనలు ఇంకా నమోదు కాలేదు. అధికారిక పోర్టల్‌ను పరిశీలించండి.",
  "Review illustrative eligibility criteria": "నమూనా అర్హత ప్రమాణాలను పరిశీలించండి",
  "Prepare sample documents": "నమూనా పత్రాలను సిద్ధం చేయండి",
  "Complete the demonstration workflow": "నమూనా ప్రక్రియను పూర్తి చేయండి",
  "Illustrative educational assistance.": "ఇది విద్యా సహాయానికి సంబంధించిన నమూనా మాత్రమే.",
  "Synthetic scholarship example for testing.": "పరీక్షల కోసం రూపొందించిన కల్పిత స్కాలర్‌షిప్ ఉదాహరణ.",
  "Sample income certificate": "నమూనా ఆదాయ ధృవపత్రం",
  "Sample student enrollment proof": "నమూనా విద్యార్థి ప్రవేశ ధృవీకరణ",
  "Needs Official Confirmation (3)": "అధికారిక నిర్ధారణ అవసరమైన పథకాలు (3)",
  "Illustrative demo": "నమూనా మాత్రమే",
  "Track scholarship applications and update their progress.": "స్కాలర్‌షిప్ దరఖాస్తులను ట్రాక్ చేసి పురోగతిని నవీకరించండి.",
  "Personal tracking status only. SUBMITTED does not confirm receipt by the government portal.": "ఇది వ్యక్తిగత ట్రాకింగ్ స్థితి మాత్రమే. సమర్పించబడింది అని చూపించినా ప్రభుత్వ పోర్టల్‌కు దరఖాస్తు చేరిందని నిర్ధారణ కాదు.",
  "All listed documents are marked prepared. Check the official portal for the actual application status and current deadline.": "జాబితాలోని అన్ని పత్రాలు సిద్ధంగా ఉన్నట్లు గుర్తించారు. అసలు దరఖాస్తు స్థితి, ప్రస్తుత గడువు కోసం అధికారిక పోర్టల్‌ను పరిశీలించండి.",
  "Saved on this browser only; not synced to your account. Do not upload identity documents here.": "ఈ బ్రౌజర్‌లో మాత్రమే సేవ్ అవుతుంది; మీ ఖాతాతో సమకాలీకరించబడదు. గుర్తింపు పత్రాలను ఇక్కడ అప్‌లోడ్ చేయవద్దు.",
  "Recent passport-size photograph": "ఇటీవలి పాస్‌పోర్ట్ పరిమాణపు ఫోటో",
  "MeeSeva caste/category certificate where applicable": "అవసరమైతే మీ సేవ కులం/వర్గం ధృవపత్రం",
  "MeeSeva family income certificate (check current validity requirements)": "మీ సేవ కుటుంబ ఆదాయ ధృవపత్రం (ప్రస్తుత చెల్లుబాటు నిబంధనలు చూడండి)",
  "Study/bonafide certificates for previous seven years": "గత ఏడు సంవత్సరాల విద్య/బోనఫైడ్ ధృవపత్రాలు",
  "Bank passbook (where required)": "అవసరమైతే బ్యాంకు పాస్‌బుక్",
  "CET allotment order for applicable professional courses": "వర్తించే వృత్తి విద్యా కోర్సులకు సీఈటీ సీటు కేటాయింపు ఉత్తర్వు",
  "Aadhaar documentation is requested by the government portal; do not enter any ID numbers in SchemeSathi": "ప్రభుత్వ పోర్టల్ ఆధార్ పత్రాలను అడగవచ్చు; స్కీమ్‌సాథిలో గుర్తింపు సంఖ్యలను నమోదు చేయవద్దు",
  "Choose when SchemeSathi should remind you about a verified upcoming deadline.": "ధృవీకరించిన రాబోయే గడువు గురించి ఎప్పుడు గుర్తుచేయాలో ఎంచుకోండి.",
  "Test browser notification": "బ్రౌజర్ నోటిఫికేషన్ పరీక్ష",
  "This is a manual demo test, not a scheduled deadline alert. Browser permission and operating-system settings affect delivery.": "ఇది చేతితో చేసే నమూనా పరీక్ష మాత్రమే; నిర్ణీత గడువు హెచ్చరిక కాదు. బ్రౌజర్ అనుమతులు, పరికర సెట్టింగ్‌లపై నోటిఫికేషన్ ఆధారపడి ఉంటుంది.",
  "Reminders are browser-only and require SchemeSathi to remain open. Closing the tab stops delivery; these are not email, SMS or scheduled background notifications.": "రిమైండర్లు బ్రౌజర్‌లో మాత్రమే పనిచేస్తాయి. స్కీమ్‌సాథి ట్యాబ్ తెరిచి ఉండాలి. ట్యాబ్ మూస్తే హెచ్చరికలు ఆగిపోతాయి; ఇవి ఈమెయిల్, ఎస్‌ఎంఎస్ లేదా బ్యాక్‌గ్రౌండ్ నోటిఫికేషన్లు కావు.",
  "Verified scholarship deadlines. Always confirm on the official source.": "ధృవీకరించిన స్కాలర్‌షిప్ గడువులు. అధికారిక మూలంలో తప్పనిసరిగా నిర్ధారించుకోండి.",
  "Academic year not recorded": "విద్యా సంవత్సరం నమోదు కాలేదు",
  "No source-verified programme records are available.": "అధికారిక మూలంతో ధృవీకరించిన పథకాల వివరాలు అందుబాటులో లేవు.",
  "Loading scholarships...": "స్కాలర్‌షిప్ వివరాలు లోడ్ అవుతున్నాయి...",
  "Programmes Awaiting Official Confirmation (3)": "అధికారిక నిర్ధారణ కోసం వేచి ఉన్న పథకాలు (3)",
  "Personal tracking notes only. Eligibility and application": "వ్యక్తిగత ట్రాకింగ్ గమనికలు మాత్రమే. అర్హత మరియు దరఖాస్తు",
  "No verified deadline": "ధృవీకరించిన గడువు లేదు"
});

const pairs = Object.entries(translations).sort((a,b)=>b[0].length-a[0].length);
function translated(text) {
  const match = text.match(/^(\s*)(.*?)(\s*)$/s);
  const value = match[2];
  if (translations[value]) return match[1]+translations[value]+match[3];
  if (/^Sample profile \d+$/.test(value)) return match[1]+value.replace('Sample profile','నమూనా వివరాలు')+match[3];
  if (/^\d+ likely matches$/.test(value)) return match[1]+value.replace('likely matches','సరిపోలికలు')+match[3];
  if (/^\d+ day\(s\) remaining$/.test(value)) return match[1]+value.replace('day(s) remaining','రోజులు మిగిలాయి')+match[3];
  let m;
  if ((m = value.match(/^Documents: (\d+) of (\d+) prepared$/))) return match[1]+`పత్రాలు: ${m[1]} / ${m[2]} సిద్ధం`+match[3];
  if ((m = value.match(/^Needs Official Confirmation \(\d+\)$/))) return match[1]+`అధికారిక నిర్ధారణ అవసరం (${m[1]})`+match[3];
  if ((m = value.match(/^Programmes Awaiting Official Confirmation \(\d+\)$/))) return match[1]+`అధికారిక నిర్ధారణ కోసం వేచి ఉన్న పథకాలు (${m[1]})`+match[3];
  if (value.match(/^\d+ upcoming verified deadline\(s\) monitored while this page is open\. Alerts appear only when the selected day threshold is reached; enabling reminders does not send an immediate test notification\.$/)) return match[1]+value.replace(/^(\d+).*/, '$1')+' ధృవీకరించిన రాబోయే గడువు ఈ పేజీ తెరిచి ఉన్నప్పుడే పర్యవేక్షించబడుతుంది. ఎంచుకున్న రోజున మాత్రమే హెచ్చరిక వస్తుంది; రిమైండర్లను ఆన్ చేయడం వల్ల వెంటనే పరీక్ష నోటిఫికేషన్ రాదు.'+match[3];
  if ((m = value.match(/^Deadline (\d{1,2} [A-Za-z]+ \d{4})$/))) return match[1]+`గడువు: ${m[1]}`+match[3];
  if (value.match(/^\d+ of \d+$/)) return match[1]+value+match[3];
  for (const [en,te] of pairs) {
    if (en.endsWith(':') && value.startsWith(en)) return match[1]+te+value.slice(en.length)+match[3];
  }
  return text;
}
const originals = new WeakMap();
const attributes = new WeakMap();
function updateTree(root, language) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script,style,textarea,[data-no-translate]')) continue;
    if (!originals.has(node)) originals.set(node,node.nodeValue);
    const original = originals.get(node);
    const target = language === 'te' ? translated(original) : original;
    if (node.nodeValue !== target) node.nodeValue=target;
  }
  const elements = root.querySelectorAll?.('input,textarea,option,[title],[aria-label]') || [];
  for (const element of elements) {
    for (const key of ['placeholder','title','aria-label']) {
      if (!element.hasAttribute(key)) continue;
      let stored = attributes.get(element);
      if (!stored) { stored={};attributes.set(element,stored); }
      if (!(key in stored)) stored[key]=element.getAttribute(key);
      const target=language==='te'?translated(stored[key]):stored[key];
      if (element.getAttribute(key)!==target) element.setAttribute(key,target);
    }
  }
}
export function useInterfaceLanguage(language) {
  useEffect(()=>{
    document.documentElement.lang=language;
    let busy=false;
    const apply=()=>{if(busy)return;busy=true;try{updateTree(document.body,language);}finally{busy=false;}};
    apply();
    const observer=new MutationObserver(mutations=>{
      if(busy)return;
      // React may replace text within existing nodes. Rebaseline only when the
      // change is not one of our own translated values.
      for(const m of mutations) if(m.type==='characterData') {
        const n=m.target;
        const prior=originals.get(n);
        if(prior!==undefined && n.nodeValue!==translated(prior) && n.nodeValue!==prior) originals.set(n,n.nodeValue);
      }
      apply();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    return ()=>observer.disconnect();
  },[language]);
}
