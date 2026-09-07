const pad = (n) => String(n).padStart(2, "0");

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayKey = () => toDateKey(new Date());

export const parseDateKey = (key) => {
  if (!isValidDateKey(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const isValidDateKey = (key) =>
  typeof key === "string" && DATE_KEY_RE.test(key);

export const addDays = (key, days) => {
  if (!isValidDateKey(key)) return null;
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};

export const isTodayKey = (key, today = todayKey()) => isValidDateKey(key) && key === today;
export const isPastKey = (key) => isValidDateKey(key) && key < todayKey();
export const isFutureKey = (key) => isValidDateKey(key) && key > todayKey();

export const formatDayKey = (key) => {
  const date = parseDateKey(key);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatKeyShort = (key) => {
  const date = parseDateKey(key);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export const formatKeyWeekday = (key) => {
  const date = parseDateKey(key);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { weekday: "long" });
};

export const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

export const monthKeyOf = (dateKey) => dateKey.slice(0, 7);

export const yearKeyOf = (dateKey) => dateKey.slice(0, 4);

export const isValidMonthKey = (key) =>
  typeof key === "string" && MONTH_KEY_RE.test(key);

export const monthStartKey = (monthKey) =>
  isValidMonthKey(monthKey) ? `${monthKey}-01` : null;

export const monthEndKey = (monthKey) => {
  if (!isValidMonthKey(monthKey)) return null;
  return addDays(`${shiftMonth(monthKey, 1)}-01`, -1);
};

export const shiftYear = (yearKey, delta) =>
  String(Number(yearKey) + delta);

// Monday-first start of the week containing the given date.
export const startOfWeekKey = (dateKey) => {
  const date = parseDateKey(dateKey);
  if (!date) return null;
  const day = (date.getDay() + 6) % 7;
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - day));
};

export const endOfWeekKey = (dateKey) =>
  addDays(startOfWeekKey(dateKey), 6);

export const addWeeks = (dateKey, weeks) =>
  addDays(dateKey, weeks * 7);

// "Sep 1 – Sep 7, 2026" style label for a week anchored at its Monday.
export const formatWeekRange = (weekStartKey) => {
  const start = parseDateKey(weekStartKey);
  const end = parseDateKey(endOfWeekKey(weekStartKey));
  if (!start || !end) return "";

  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return start.getFullYear() === end.getFullYear()
    ? `${startLabel} – ${endLabel}, ${start.getFullYear()}`
    : `${startLabel}, ${start.getFullYear()} – ${endLabel}, ${end.getFullYear()}`;
};

export const formatMonthShort = (monthKey) => {
  if (!isValidMonthKey(monthKey)) return "";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

export const shiftMonth = (monthKey, delta) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

// Build a Monday-first month grid of weeks.
export const buildMonthGrid = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDow = (firstOfMonth.getDay() + 6) % 7;

  const weeks = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const dayOffset = weekIndex * 7 + dayIndex - startDow;
      const date = new Date(year, month - 1, 1 + dayOffset);

      week.push({
        key: toDateKey(date),
        day: date.getDate(),
        inMonth: date.getMonth() === month - 1,
      });
    }

    weeks.push(week);
  }

  return weeks;
};

export const greeting = () => {
  const hour = new Date().getHours();

  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};