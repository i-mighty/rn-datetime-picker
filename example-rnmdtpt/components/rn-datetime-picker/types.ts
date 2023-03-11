export enum Modes {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  FINAL = "final",
}

export type Mode = "day" | "week" | "month" | "year" | "final";

export interface BlockType {
  type: "time" | "date" | "month" | "year" | "week" | "weekday";
  repeat: boolean;
  date?: Date | string;
  time?: {
    from: Date | string;
    to: Date | string;
  };
}

export type SelectorMode = "time" | "date" | "datetime";
