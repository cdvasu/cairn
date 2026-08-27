/** A thing you keep returning to. Lives on the heatmap only. */
export type Tracker = {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type DayLog = {
  user_id: string;
  tracker_id: string;
  day: string;
  created_at: string;
};

/** A grouping on the todo page. Deliberately unrelated to trackers. */
export type List = {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Todo = {
  id: string;
  user_id: string;
  list_id: string;
  day: string;
  title: string;
  done: boolean;
  is_minimum: boolean;
  position: number;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  day: string;
  content: string;
  updated_at: string;
};

type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      trackers: Row<Tracker>;
      day_logs: Row<DayLog>;
      lists: Row<List>;
      todos: Row<Todo>;
      journal_entries: Row<JournalEntry>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
