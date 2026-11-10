import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localTeamReply } from "./local-team";
import { BOTS, ROUTINES, botById, botByName, type Bot, type Routine } from "./team";

export type View =
  | { name: "conversation" }
  | { name: "chats" }
  | { name: "bots" }
  | { name: "bot"; id: string }
  | { name: "routines" }
  | { name: "apps" }
  | { name: "settings" };

export type Approval = {
  title: string;
  detail: string;
  status: "pending" | "approved" | "declined";
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: "user" | "bot";
  botId?: string;
  botName?: string;
  text: string;
  attachmentName?: string;
  imageUrl?: string;
  approval?: Approval;
  createdAt: number;
};

export type Thread = {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  focusBotId?: string;
};

type Attachment = { name: string; imageUrl?: string };

type State = {
  stack: View[];
  page: number;
  threads: Thread[];
  messages: ChatMessage[];
  currentId: string | null;
  bots: Bot[];
  routines: Routine[];
  connections: Record<string, boolean>;
  haptics: boolean;
  sound: boolean;
  drafts: Record<string, string>;
  seeded: boolean;
  busy: boolean;
  error: string | null;
  push: (view: View) => void;
  pop: () => void;
  goNew: () => void;
  openThread: (id: string) => void;
  setPage: (page: number) => void;
  setDraft: (key: string, value: string) => void;
  startWithBot: (botId: string) => void;
  ask: (text: string, attachment?: Attachment) => Promise<void>;
  retry: () => Promise<void>;
  setApproval: (messageId: string, status: "approved" | "declined") => void;
  addBot: (bot: Omit<Bot, "id" | "builtin">) => void;
  duplicateBot: (id: string) => void;
  removeBot: (id: string) => void;
  toggleRoutine: (id: string) => void;
  addRoutine: (routine: Omit<Routine, "id" | "builtin">) => void;
  runRoutine: (id: string) => Promise<void>;
  toggleConnection: (id: string) => void;
  setHaptics: (value: boolean) => void;
  setSound: (value: boolean) => void;
  deleteThread: (id: string) => void;
};

function uid() {
  return crypto.randomUUID();
}

function blip() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 740;
    gain.gain.value = 0.015;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => void ctx.close();
  } catch {
    /* autoplay or missing audio is fine */
  }
}

const sampleThreadId = "sample-renewal";
const sampleAt = Date.UTC(2026, 9, 31, 4, 10, 0);

const sampleThread: Thread = {
  id: sampleThreadId,
  title: "Unsigned renewal",
  preview: "Draft is ready. Nothing goes out until you approve.",
  updatedAt: sampleAt,
};

const sampleMessages: ChatMessage[] = [
  {
    id: "sample-user",
    threadId: sampleThreadId,
    role: "user",
    text: "Priya hasn't signed the renewal. Draft a follow-up and don't send it.",
    createdAt: sampleAt - 60_000,
  },
  {
    id: "sample-nova",
    threadId: sampleThreadId,
    role: "bot",
    botId: "nova",
    botName: "Nova",
    text: "Mira has her thread. I'll stay on the renewal and only bring you the send.",
    createdAt: sampleAt - 40_000,
  },
  {
    id: "sample-mira",
    threadId: sampleThreadId,
    role: "bot",
    botId: "mira",
    botName: "Mira",
    text: "Draft is ready. Short, in your voice, and it mentions Friday as the last day to sign.",
    createdAt: sampleAt,
    approval: {
      title: "Send the follow-up to Priya",
      detail: "Replies from your address. Nothing goes out until you approve.",
      status: "pending",
    },
  },
];

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      stack: [{ name: "conversation" }],
      page: 0,
      threads: [sampleThread],
      messages: sampleMessages,
      currentId: null,
      bots: BOTS,
      routines: ROUTINES,
      connections: {},
      haptics: true,
      sound: true,
      drafts: {},
      seeded: true,
      busy: false,
      error: null,
      push: (view) => set((state) => ({ stack: [...state.stack, view] })),
      pop: () =>
        set((state) =>
          state.stack.length > 1 ? { stack: state.stack.slice(0, -1) } : state,
        ),
      goNew: () => set({ stack: [{ name: "conversation" }], currentId: null, page: 0, error: null }),
      openThread: (id) =>
        set((state) => ({
          currentId: id,
          error: null,
          stack: state.stack[state.stack.length - 1]?.name === "chats"
            ? [...state.stack, { name: "conversation" }]
            : [{ name: "chats" }, { name: "conversation" }],
        })),
      setPage: (page) => set({ page }),
      setDraft: (key, value) => set((state) => ({ drafts: { ...state.drafts, [key]: value } })),
      startWithBot: (botId) => {
        const bot = botById(get().bots, botId);
        const id = uid();
        set((state) => ({
          currentId: id,
          error: null,
          threads: [
            {
              id,
              title: bot?.name ?? "Bot",
              preview: "New chat",
              updatedAt: Date.now(),
              focusBotId: botId,
            },
            ...state.threads,
          ],
          stack: [...state.stack, { name: "conversation" }],
        }));
      },
      ask: async (text, attachment) => {
        const trimmed = text.trim();
        if ((!trimmed && !attachment) || get().busy) return;
        const state = get();
        let threadId = state.currentId;
        const existing = state.threads.find((thread) => thread.id === threadId);
        if (!threadId || !existing) {
          threadId = uid();
          set({
            currentId: threadId,
            threads: [
              {
                id: threadId,
                title: "Grok Bot",
                preview: trimmed || attachment?.name || "",
                updatedAt: Date.now(),
              },
              ...get().threads,
            ],
          });
        }
        const thread = get().threads.find((item) => item.id === threadId)!;
        const userMessage: ChatMessage = {
          id: uid(),
          threadId,
          role: "user",
          text: trimmed,
          attachmentName: attachment?.name,
          imageUrl: attachment?.imageUrl,
          createdAt: Date.now(),
        };
        set((current) => ({
          error: null,
          messages: [...current.messages, userMessage].slice(-200),
          drafts: { ...current.drafts, [threadId!]: "", new: "" },
          stack:
            current.stack[current.stack.length - 1]?.name === "conversation"
              ? current.stack
              : [...current.stack, { name: "conversation" }],
          threads: current.threads.map((item) =>
            item.id === threadId
              ? { ...item, preview: trimmed || attachment?.name || item.preview, updatedAt: Date.now() }
              : item,
          ),
        }));
        if (state.haptics && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
        const focus = thread.focusBotId ? botById(get().bots, thread.focusBotId)?.name ?? "" : "";
        const result = localTeamReply({
          text: trimmed || `Look at ${attachment?.name ?? "this"}.`,
          focus,
          attachmentName: attachment?.name ?? "",
        });
        if (result.title && (thread.title === "Grok Bot" || thread.preview === "New chat")) {
          set((current) => ({
            threads: current.threads.map((item) =>
              item.id === threadId ? { ...item, title: result.title } : item,
            ),
          }));
        }
        const knownBots = get().bots;
        const chats: ChatMessage[] = result.messages.map((message) => {
          const known = botByName(knownBots, message.bot);
          return {
            id: uid(),
            threadId,
            role: "bot" as const,
            botId: known?.id,
            botName: known?.name ?? message.bot,
            text: message.text,
            approval: message.approval ? { ...message.approval, status: "pending" as const } : undefined,
            createdAt: Date.now(),
          };
        });
        const last = chats[chats.length - 1];
        set((current) => ({
          busy: false,
          messages: [...current.messages, ...chats].slice(-200),
          threads: current.threads.map((item) =>
            item.id === threadId
              ? { ...item, preview: last?.text ?? item.preview, updatedAt: Date.now() }
              : item,
          ),
        }));
        if (get().sound) blip();
      },
      retry: async () => {
        const state = get();
        if (!state.currentId || state.busy) return;
        const last = [...state.messages].reverse().find((message) => message.threadId === state.currentId);
        if (!last || last.role !== "user") return;
        set((current) => ({
          messages: current.messages.filter((message) => message.id !== last.id),
          error: null,
        }));
        await get().ask(last.text, last.attachmentName ? { name: last.attachmentName, imageUrl: last.imageUrl } : undefined);
      },
      setApproval: (messageId, status) => {
        const message = get().messages.find((item) => item.id === messageId);
        if (!message?.approval || message.approval.status !== "pending") return;
        const follow: ChatMessage = {
          id: uid(),
          threadId: message.threadId,
          role: "bot",
          botId: message.botId,
          botName: message.botName,
          text:
            status === "approved"
              ? `Approved. ${message.approval.title}.`
              : "Held. Nothing was sent.",
          createdAt: Date.now(),
        };
        set((current) => ({
          messages: [
            ...current.messages.map((item) =>
              item.id === messageId && item.approval ? { ...item, approval: { ...item.approval, status } } : item,
            ),
            follow,
          ].slice(-200),
          threads: current.threads.map((thread) =>
            thread.id === message.threadId
              ? { ...thread, preview: follow.text, updatedAt: Date.now() }
              : thread,
          ),
        }));
      },
      addBot: (bot) => {
        const next: Bot = { ...bot, id: uid(), builtin: false };
        set((state) => ({ bots: [...state.bots, next], stack: [...state.stack, { name: "bot", id: next.id }] }));
      },
      duplicateBot: (id) => {
        const bot = botById(get().bots, id);
        if (!bot) return;
        const copy: Bot = {
          ...bot,
          id: uid(),
          name: `${bot.name} copy`,
          lead: false,
          builtin: false,
        };
        set((state) => ({ bots: [...state.bots, copy], stack: [...state.stack, { name: "bot", id: copy.id }] }));
      },
      removeBot: (id) =>
        set((state) => ({
          bots: state.bots.filter((bot) => bot.id !== id || bot.builtin),
          stack: state.stack.filter((view) => !(view.name === "bot" && view.id === id)),
        })),
      toggleRoutine: (id) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id ? { ...routine, enabled: !routine.enabled } : routine,
          ),
        })),
      addRoutine: (routine) =>
        set((state) => ({ routines: [...state.routines, { ...routine, id: uid(), builtin: false }] })),
      runRoutine: async (id) => {
        const routine = get().routines.find((item) => item.id === id);
        if (!routine) return;
        const bot = botById(get().bots, routine.botId);
        const threadId = uid();
        set((state) => ({
          currentId: threadId,
          error: null,
          threads: [
            {
              id: threadId,
              title: routine.name,
              preview: routine.detail,
              updatedAt: Date.now(),
              focusBotId: routine.botId,
            },
            ...state.threads,
          ],
          stack: [{ name: "chats" }, { name: "conversation" }],
        }));
        await get().ask(
          `Run the routine "${routine.name}". ${routine.detail} ${bot ? `${bot.name} owns this.` : ""}`,
        );
      },
      toggleConnection: (id) =>
        set((state) => ({ connections: { ...state.connections, [id]: !state.connections[id] } })),
      setHaptics: (haptics) => set({ haptics }),
      setSound: (sound) => set({ sound }),
      deleteThread: (id) =>
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== id),
          messages: state.messages.filter((message) => message.threadId !== id),
          currentId: state.currentId === id ? null : state.currentId,
        })),
    }),
    {
      name: "grok-bot",
      skipHydration: true,
      partialize: (state) => ({
        stack: state.stack,
        threads: state.threads,
        messages: state.messages.map((message) => {
          const copy = { ...message };
          delete copy.imageUrl;
          return copy;
        }),
        currentId: state.currentId,
        bots: state.bots,
        routines: state.routines,
        connections: state.connections,
        haptics: state.haptics,
        sound: state.sound,
        drafts: state.drafts,
        seeded: state.seeded,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<State>;
        const seeded = saved.seeded === true;
        const savedThreads = saved.threads ?? [];
        const savedMessages = saved.messages ?? [];
        return {
          ...current,
          ...saved,
          seeded: true,
          busy: false,
          error: null,
          threads: seeded
            ? savedThreads
            : [sampleThread, ...savedThreads.filter((thread) => thread.id !== sampleThreadId)],
          messages: seeded
            ? savedMessages
            : [...sampleMessages, ...savedMessages.filter((message) => message.threadId !== sampleThreadId)],
        };
      },
    },
  ),
);
