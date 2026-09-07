import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Modal from "../common/Modal";
import CategorySelector from "./CategorySelector";

import { isValidDateKey, todayKey, formatDayKey } from "../../utils/dates";

// Create and edit tasks. Task dates are set at creation and never change.
const TaskForm = ({
  open,
  onClose,
  mode = "create",
  task = null,
  initialDate = null,
  categories = [],
  onSubmit,
  onOpenCategoryCreator,
  onOpenSubcategoryCreator,
  loading = false,
}) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate || todayKey());
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title || "");
    setCategory(task?.category?._id || "");
    setDate(initialDate || todayKey());
    setError("");
  }, [open, task, initialDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (mode === "create" && !isValidDateKey(date)) {
      setError("Please choose a valid date.");
      return;
    }

    try {
      const payload =
        mode === "edit"
          ? { title: title.trim(), category: category || null }
          : { title: title.trim(), date, category: category || null };

      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit task" : "Add a task"}
      size="sm"
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="task-title">What needs to be done?</label>

          <input
            id="task-title"
            type="text"
            placeholder="e.g. Complete React project"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label>{mode === "edit" ? "Date" : "Date"}</label>

          {mode === "create" ? (
            <input
              type="date"
              className="date-input"
              value={date}
              min={todayKey()}
              onChange={(event) => setDate(event.target.value)}
            />
          ) : (
            <div className="readonly-date">{task ? formatDayKey(task.dateKey) : ""}</div>
          )}

          <p className="form-hint">
            {mode === "edit" ? "A task always stays on the day it was created." : "Tasks belong permanently to their chosen day."}
          </p>
        </div>

        <div className="form-field">
          <label>Category</label>

          <CategorySelector
            categories={categories}
            value={category}
            onChange={setCategory}
            onCreateCategory={onOpenCategoryCreator}
            onCreateSubcategory={onOpenSubcategoryCreator}
          />

          <p className="form-hint">Optional — you can leave tasks uncategorized.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-footer-inner">
          <button type="button" className="df-btn secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="df-btn primary" disabled={loading || !title.trim()}>
            <Plus size={16} />
            {loading ? "Saving..." : mode === "edit" ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;