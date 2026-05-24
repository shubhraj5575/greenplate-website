export interface ChatRule {
  pattern: RegExp;
  response: string | ((msg: string) => string);
}

export const CHAT_RULES: ChatRule[] = [
  // Greetings
  {
    pattern: /^(hi|hello|hey|namaste|hola|greetings)/i,
    response: "Hi! I'm GreenPlate's assistant. Ask me anything about carbon measurement, our methodology, or how to use the app.",
  },
  // What is GreenPlate
  {
    pattern: /what is greenplate|about greenplate|tell me about|who are you/i,
    response: "GreenPlate measures carbon footprints for India's food sector. We give individuals and restaurants a precise, data-backed number — based on Indian emission factors, not global averages. No offsets, no spin.",
  },
  // How carbon is calculated
  {
    pattern: /how.*(carbon|footprint|calculat|measur)/i,
    response: "We calculate your annual kg CO₂e by multiplying activity data (fuel used, electricity consumed, food served) by peer-reviewed emission factors. Every factor cites its source. See /methodology for the full breakdown.",
  },
  // Scope 1
  {
    pattern: /scope 1|scope1/i,
    response: "Scope 1 covers direct emissions — fuel you burn on-site: LPG, PNG, diesel backup generators, and refrigerant leaks from cold storage and ACs.",
  },
  // Scope 2
  {
    pattern: /scope 2|scope2/i,
    response: "Scope 2 is purchased electricity. We use India's national grid emission factor of 0.716 kg CO₂/kWh (CEA 2023). Your DISCOM bill tells you how many kWh.",
  },
  // Scope 3
  {
    pattern: /scope 3|scope3/i,
    response: "Scope 3 covers your value chain: ingredients (your menu), inbound logistics, food waste, packaging, and employee commutes. For most restaurants, ingredients are 60–80% of total carbon.",
  },
  // Dashboard
  {
    pattern: /dashboard|read.*result|understand.*number|what.*number mean/i,
    response: "Your dashboard shows your annual kg CO₂e, a breakdown by category, how you compare to India's per-capita average (1.9 tCO₂e/yr), and the equivalent in trees, car km, and flights. For org accounts, you'll also see Scope 1/2/3 tiles.",
  },
  // Food database
  {
    pattern: /food (db|database|item)|ingredient|menu.*item/i,
    response: "Our food database has 1,500+ Indian-priority items with kg CO₂e/kg factors. When adding menu items in the calculator, search by ingredient name to auto-fill the emission factor.",
  },
  // Data sources
  {
    pattern: /data source|where.*data|emission factor|source/i,
    response: "Our factors come from Our World in Data, DEFRA, FAO, Agribalyse, ICAT India, CEA, and IPCC AR6 — cross-referenced for India where possible. See /methodology#sources for citations.",
  },
  // Contact
  {
    pattern: /contact|email|reach|write to|support/i,
    response: "Write to us at greenplate@greenplate.online. You can also use the /contact page for structured enquiries.",
  },
  // Pricing
  {
    pattern: /pric|cost|free|pay|plan|billing|subscri/i,
    response: "Individual footprint tracking is free. Restaurant/kitchen accounts are on pilot pricing during the beta — write to greenplate@greenplate.online to discuss.",
  },
  // Careers
  {
    pattern: /career|job|work.*with|join|hire/i,
    response: "We don't have open roles right now, but we'd love to hear from people who care about this problem. Write to greenplate@greenplate.online with a note about your work.",
  },
  // Sign-in problems
  {
    pattern: /sign.?in|log.?in|login|password|account|auth/i,
    response: "You can sign in with Google or with an email/password on the /login page. If you're having trouble, write to greenplate@greenplate.online.",
  },
  // Methodology
  {
    pattern: /methodology|method|how accurate|confidence|uncertainty/i,
    response: "Our methodology is fully public at /methodology. Every factor includes the source, year, region, and confidence band. We update it as better Indian data becomes available.",
  },
  // History
  {
    pattern: /histor|past calculation|previous run|saved/i,
    response: "All your calculations are saved in /history. Click any row to load that snapshot in your dashboard. You can also rename runs for easy reference.",
  },
];

export const SUGGESTIONS = [
  "How is Scope 3 calculated?",
  "What data sources?",
  "Contact support",
];

export const FALLBACK =
  "I'm not sure about that yet — I'm a rule-based assistant with limited coverage. For anything specific, write to greenplate@greenplate.online or visit /contact.";

export function matchRule(message: string): string {
  const msg = message.trim();
  for (const rule of CHAT_RULES) {
    if (rule.pattern.test(msg)) {
      return typeof rule.response === "function" ? rule.response(msg) : rule.response;
    }
  }
  return FALLBACK;
}
