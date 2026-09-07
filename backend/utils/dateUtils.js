const pad = (n) => String(n).padStart(2, "0");

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Convert any Date to a YYYY-MM-DD calendar key using LOCAL time.
// This is the single source of truth for "which calendar day".
const toDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Today's local calendar key.
const todayKey = () => toDateKey(new Date());

const isValidDateKey = (value) =>
  typeof value === "string" && DATE_KEY_RE.test(value);

// Parse a YYYY-MM-DD key into a Date object pinned to UTC midnight.
// This keeps the stored Date identical regardless of server timezone.
const parseDateKey = (dateKey) => {
  if (!isValidDateKey(dateKey)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

// Accepts a Date, ISO string, or YYYY-MM-DD key.
// Returns a UTC-midnight Date normalized to that calendar day.
const normalizeDate = (value) => {
  if (value == null) return null;

  const key = isValidDateKey(value) ? value : toDateKey(value);

  if (!key) return null;

  return parseDateKey(key);
};

const isPastDateKey = (dateKey, today = todayKey()) =>
  isValidDateKey(dateKey) && dateKey < today;

const isFutureDateKey = (dateKey, today = todayKey()) =>
  isValidDateKey(dateKey) && dateKey > today;

const isTodayDateKey = (dateKey, today = todayKey()) =>
  isValidDateKey(dateKey) && dateKey === today;

// Reads the client's local "today" (YYYY-MM-DD) from the x-client-date
// header so the read-only boundary matches the browser's calendar.
// Falls back to the server's local today when the header is missing.
const clientTodayKey = (req) => {
  const header = req?.headers?.["x-client-date"];

  return isValidDateKey(header) ? header : todayKey();
};

// Add (or subtract) days from a YYYY-MM-DD key. DST safe.
const addDays = (dateKey, days) => {
  if (!isValidDateKey(dateKey)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(year, month - 1, day + days);

  return toDateKey(date);
};

// Month-start key for a given key.
const monthStartOf = (dateKey) => {
  if (!isValidDateKey(dateKey)) return null;

  return dateKey.slice(0, 8) + "01";
};

// True if `target` is on or after `from` (both keys).
const isOnOrAfter = (target, from) =>
  isValidDateKey(target) && isValidDateKey(from) && target >= from;

// One-time backfill: legacy tasks stored before the dateKey era.
const backfillDateKeys = async (TaskModel) => {
  const docs = await TaskModel.find({
    $or: [{ dateKey: { $exists: false } }, { dateKey: null }],
  })
    .select("_id taskDate")
    .lean();

  const operations = docs
    .map((doc) => {
      const key = toDateKey(doc.taskDate);

      if (!key) return null;

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { dateKey: key } },
        },
      };
    })
    .filter(Boolean);

  if (operations.length > 0) {
    await TaskModel.bulkWrite(operations);
  }

  return operations.length;
};

module.exports = {
  toDateKey,
  todayKey,
  isValidDateKey,
  parseDateKey,
  normalizeDate,
  isPastDateKey,
  isFutureDateKey,
  isTodayDateKey,
  clientTodayKey,
  addDays,
  monthStartOf,
  isOnOrAfter,
  backfillDateKeys,
};