export type Bot = {
  id: string;
  name: string;
  role: string;
  lane: string;
  blurb: string;
  lead?: boolean;
  builtin?: boolean;
};

export type Routine = {
  id: string;
  name: string;
  detail: string;
  when: string;
  botId: string;
  enabled: boolean;
  builtin?: boolean;
};

export type Connection = {
  id: string;
  name: string;
  detail: string;
};

export const BOTS: Bot[] = [
  {
    id: "nova",
    name: "Nova",
    role: "Chief of Staff",
    lane: "Coordination",
    blurb:
      "Owns the thread. Hands work to the right teammate and brings you one update.",
    lead: true,
    builtin: true,
  },
  {
    id: "ada",
    name: "Ada",
    role: "Sales Outbound",
    lane: "Sales",
    blurb: "Researches accounts, drafts outreach, and updates the CRM. Queues every send.",
    builtin: true,
  },
  {
    id: "ravi",
    name: "Ravi",
    role: "Talent Scout",
    lane: "Recruiting",
    blurb: "Sources candidates, skips anyone already in your ATS, and writes in your voice.",
    builtin: true,
  },
  {
    id: "mira",
    name: "Mira",
    role: "Inbox Manager",
    lane: "Inbox",
    blurb: "Triages mail, flags what is urgent, and drafts replies. Never sends without you.",
    builtin: true,
  },
  {
    id: "otto",
    name: "Otto",
    role: "Expense Manager",
    lane: "Finance",
    blurb: "Pulls receipts, codes expenses, and chases whatever is missing.",
    builtin: true,
  },
  {
    id: "juno",
    name: "Juno",
    role: "Invoice Collector",
    lane: "Finance",
    blurb: "Signs into vendor portals, downloads invoices, and parks them for review.",
    builtin: true,
  },
  {
    id: "sable",
    name: "Sable",
    role: "Account Health",
    lane: "Customer success",
    blurb: "Writes the digest, flags risk, and drafts the next step so accounts stay warm.",
    builtin: true,
  },
  {
    id: "pike",
    name: "Pike",
    role: "Bug Reproduction",
    lane: "Engineering",
    blurb: "Recreates the issue and hands engineering a clean write-up.",
    builtin: true,
  },
  {
    id: "quinn",
    name: "Quinn",
    role: "Competitive Intelligence",
    lane: "Research",
    blurb: "Watches overnight for launches, pricing changes, and stale messaging.",
    builtin: true,
  },
];

export const ROUTINES: Routine[] = [
  {
    id: "inbox-morning",
    name: "Morning inbox",
    detail: "Triage overnight mail, flag anything urgent, and draft replies for approval.",
    when: "Weekdays · 8:00",
    botId: "mira",
    enabled: true,
    builtin: true,
  },
  {
    id: "invoice-friday",
    name: "Invoice pull",
    detail: "Download new invoices from vendor portals and park them for review.",
    when: "Fridays · 4:00",
    botId: "juno",
    enabled: true,
    builtin: true,
  },
  {
    id: "pipeline",
    name: "Pipeline follow-up",
    detail: "Draft follow-ups for quiet deals and queue them. Do not send.",
    when: "Daily · 9:30",
    botId: "ada",
    enabled: false,
    builtin: true,
  },
  {
    id: "watch",
    name: "Competitive watch",
    detail: "Note any launch, pricing change, or messaging shift since yesterday.",
    when: "Daily · 6:00",
    botId: "quinn",
    enabled: false,
    builtin: true,
  },
];

export const CONNECTIONS: Connection[] = [
  { id: "gmail", name: "Gmail", detail: "Inbox, drafts, and follow-ups" },
  { id: "calendar", name: "Calendar", detail: "Holds and follow-up times" },
  { id: "slack", name: "Slack", detail: "Internal threads and handoffs" },
  { id: "notion", name: "Notion", detail: "Notes, specs, and trackers" },
  { id: "linear", name: "Linear", detail: "Bugs and the write-ups Pike files" },
  { id: "salesforce", name: "Salesforce", detail: "CRM updates after a call" },
  { id: "github", name: "GitHub", detail: "Repos, issues, and pull requests" },
  { id: "browser", name: "Browser", detail: "Vendor portals and tools with no API" },
];

export function botById(bots: Bot[], id?: string) {
  return bots.find((bot) => bot.id === id);
}

export function botByName(bots: Bot[], name: string) {
  return bots.find((bot) => bot.name.toLowerCase() === key);
}
