import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Modal from "../common/Modal";
import CategorySelector from "../tasks/CategorySelector";

const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// 0 = Sunday ... 6 = Saturday (matches Date#getDay()).
const WEEKDAY_LABELS = [
  { value: 0, label: "Su" },
  { value: 1, label: "Mo" },
  { value: 2, label: "Tu" },
  { value: 3, label: "We" },
  { value: 4, label: "Th" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
];

// Create and edit time-blocked schedule items.
const ScheduleForm = ({
  open,
  onClose,
  mode = "create",
  item = null,
  presetStart = null,
  presetEnd = null,
  categories = [],
  onSubmit,
  onOpenCategoryCreator,
  onOpenSubcategoryCreator,
  loading = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatDays, setRepeatDays] = useState([1, 3, 5]);
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(item?.title || "");
    setDescription(item?.description || "");
    setStartTime(item?.startTime || presetStart || "09:00");
    setEndTime(item?.endTime || (mode === "create" ? presetEnd || "" : ""));
    setCategory(item?.category?._id || "");
    setRepeatType(item?.recurrence?.type || "none");
    setRepeatDays(item?.recurrence?.daysOfWeek?.length
      ? item.recurrence.daysOfWeek
      : [1, 3, 5]);
    setRepeatEndDate(item?.recurrence?.endDate || "");
    setError("");
  }, [open, item, presetStart, presetEnd, mode]);

  const toggleRepeatDay = (day) => {
    setRepeatDays((previous) =>
      previous.includes(day)
        ? previous.filter((value) => value !== day)
        : [...previous, day].sort()
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("A title is required.");
      return;
    }

    if (!startTime) {
      setError("A start time is required.");
      return;
    }

    if (endTime && endTime <= startTime) {
      setError("The end time must be after the start time.");
      return;
    }

    if (repeatType === "weekly" && repeatDays.length === 0) {
      setError("Pick at least one weekday for weekly scheduling.");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startTime,
        endTime: endTime || "",
        category: category || null,
        recurrence: {
          type: repeatType,
          daysOfWeek: repeatType === "weekly" ? repeatDays : [],
          endDate: repeatEndDate || null,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit time block" : "Add a time block"}
      size="sm"
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="schedule-title">Title</label>

          <input
            id="schedule-title"
            type="text"
            placeholder="e.g. Deep work session"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="schedule-start">Start</label>
            <input
              id="schedule-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="schedule-end">End</label>
            <input
              id="schedule-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="schedule-repeat">Repeats</label>

          <select
            id="schedule-repeat"
            value={repeatType}
            onChange={(event) => setRepeatType(event.target.value)}
          >
            {REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {repeatType === "weekly" && (
          <div className="form-field">
            <label>On which days?</label>

            <div className="weekday-toggle">
              {WEEKDAY_LABELS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  className={repeatDays.includes(value) ? "active" : ""}
                  onClick={() => toggleRepeatDay(value)}
                  aria-pressed={repeatDays.includes(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {repeatType !== "none" && (
          <div className="form-field">
            <label htmlFor="schedule-repeat-end">Repeat until (optional)</label>
            <input
              id="schedule-repeat-end"
              type="date"
              value={repeatEndDate}
              onChange={(event) => setRepeatEndDate(event.target.value)}
            />
            <p className="form-hint">Leave empty to repeat indefinitely.</p>
          </div>
        )}

        <div className="form-field">
          <label>Category</label>

          <CategorySelector
            categories={categories}
            value={category}
            onChange={setCategory}
            onCreateCategory={onOpenCategoryCreator}
            onCreateSubcategory={onOpenSubcategoryCreator}
          />

          <p className="form-hint">Optional — time blocks work without a category.</p>
        </div>

        <div className="form-field">
          <label htmlFor="schedule-notes">Notes</label>

          <textarea
            id="schedule-notes"
            rows={3}
            placeholder="Location, link, anything useful…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-footer-inner">
          <button type="button" className="df-btn secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="df-btn primary" disabled={loading || !title.trim()}>
            <Plus size={16} />
            {loading ? "Saving..." : mode === "edit" ? "Save changes" : "Add time block"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleForm;