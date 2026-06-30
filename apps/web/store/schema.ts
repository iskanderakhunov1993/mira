import { z } from "zod";

export const persistedMiraStateSchema = z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().optional(),
    trackingMonths: z.number(),
    totalCycles: z.number(),
  }),
  cycle: z.object({
    averageLength: z.number(),
    periodLength: z.number(),
    lastPeriodStart: z.string().nullable(),
    cycles: z.array(z.unknown()),
    currentDay: z.number(),
    phase: z.enum(["menstrual", "follicular", "ovulatory", "luteal"]),
    daysUntilPeriod: z.number(),
  }),
  logs: z.object({
    dailyLogs: z.array(z.unknown()),
    currentDate: z.string(),
  }),
  care: z.object({
    water: z.object({ current: z.number(), target: z.number() }),
    vitamins: z.object({ magnesium: z.boolean(), omega3: z.boolean(), zinc: z.boolean() }),
    weight: z.object({
      current: z.number().nullable(),
      history: z.array(z.object({ date: z.string(), weight: z.number() })),
    }),
    activity: z.object({
      walking: z.enum(["none", "little", "normal", "much"]).nullable(),
      workout: z.enum(["none", "light", "medium", "heavy"]).nullable(),
    }),
  }),
  settings: z.object({
    reminders: z.object({ water: z.boolean(), log: z.boolean(), vitamins: z.boolean() }),
    privacy: z.object({
      pin: z.boolean(),
      pinCode: z.string().nullable(),
      dataStorage: z.enum(["device", "cloud"]),
    }),
    achievements: z.array(z.unknown()),
  }),
});
