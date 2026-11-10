export type LocalTeamMessage = {
  bot: string;
  text: string;
  approval?: { title: string; detail: string };
};

const lanes: { test: RegExp; bot: string; lane: string }[] = [
  { test: /inbox|email|mail|reply|thread/i, bot: "Mira", lane: "inbox" },
  { test: /invoice|vendor|receipt/i, bot: "Juno", lane: "invoices" },
  { test: /expense|receipt|reimburse/i, bot: "Otto", lane: "expenses" },
  { test: /hire|candidate|recruit|resume|talent/i, bot: "Ravi", lane: "candidates" },
  { test: /bug|crash|repro|ticket|issue/i, bot: "Pike", lane: "the bug" },
  { test: /outbound|crm|deal|renewal|follow-?up|sales|pipeline/i, bot: "Ada", lane: "outbound" },
  { test: /account|churn|health|customer/i, bot: "Sable", lane: "the account" },
  { test: /competitor|pricing|launch|intel/i, bot: "Quinn", lane: "the watch" },
];

function clip(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 87)}…` : clean;
}

function titleFrom(text: string) {
  const words = text.replace(/[^\w\s'-]/g, " ").trim().split(/\s+/).slice(0, 4);
  if (!words[0]) return "New task";
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function localTeamReply(input: {
  text: string;
  focus: string;
  attachmentName: string;
}): { title: string; messages: LocalTeamMessage[] } {
  const text = input.text.trim();
  const job = clip(text);
  const hit = lanes.find((lane) => lane.test.test(text));
  const needsYes = /send|email|post|pay|charge|publish|submit|schedule a meeting/i.test(text);
  const file = input.attachmentName ? ` I have ${input.attachmentName}.` : "";

  if (input.focus) {
    const bot = input.focus;
    const approval = needsYes
      ? { title: `Finish “${job}”`, detail: "Nothing goes out until you approve." }
      : undefined;
    return {
      title: titleFrom(text),
      messages: [
        {
          bot,
          text: `On it.${file} I’ll handle “${job}” and stop if it needs a yes.`,
          approval,
        },
      ],
    };
  }

  const specialist = hit?.bot ?? "Mira";
  const lane = hit?.lane ?? "this";
  const messages: LocalTeamMessage[] = [
    {
      bot: "Nova",
      text: `${specialist} has ${lane}.${file} I’ll only ping you if it needs a yes.`,
    },
    {
      bot: specialist,
      text: needsYes
        ? `Draft is ready for “${job}”. Nothing is sent yet.`
        : `Working “${job}” now. I’ll drop the result in this thread.`,
      approval: needsYes
        ? { title: `Send “${job}”`, detail: "Queued on my computer. Nothing goes out until you approve." }
        : undefined,
    },
  ];
  return { title: titleFrom(text), messages };
}
