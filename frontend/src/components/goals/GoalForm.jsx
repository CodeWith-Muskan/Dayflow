import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Modal from "../common/Modal";
import CategorySelector from "../tasks/CategorySelector";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

// Shared create/edit form for monthly and yearly goals.
const GoalForm = ({
  open,
  onClose,
  goalType = "monthly",
  mode = "create",
  goal = null,
  defaultMonth,
  defaultYear,
  categories = [],
  onOpenCategoryCreator,
  onOpenSubcategoryCreator,
  onSubmit,
  loading = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(defaultMonth || 1);
  const [year, setYear] = useState(defaultYear || new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState("");
  const [category, setCategory] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(goal?.title || "");
    setDescription(goal?.description || "");
    setProgress(goal?.progress || 0);
    setMonth(goal?.month || defaultMonth || 1);
    setYear(goal?.year || defaultYear || new Date().getFullYear());
    setTargetMonth(goal?.targetMonth ?? "");
    setCategory(goal?.category?._id || "");
    setError("");
  }, [open, goal, defaultMonth, defaultYear]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("A goal title is required.");
      return;
    }

    const payload =
      goalType === "monthly"
        ? {
            title: title.trim(),
            description: description.trim(),
            month: Number(month),
            year: Number(year),
            progress: Number(progress) || 0,
          }
        : {
            title: title.trim(),
            description: description.trim(),
            year: Number(year),
            targetMonth: targetMonth ? Number(targetMonth) : null,
            category: category || null,
            progress: Number(progress) || 0,
          };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const inputYear = Number.isFinite(Number(year)) ? Number(year) : 2026;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === "edit"
          ? "Edit goal"
          : goalType === "monthly"
          ? "Add a monthly goal"
          : "Add a yearly goal"
      }
      size="sm"
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="goal-title">Goal</label>

          <input
            id="goal-title"
            type="text"
            placeholder="e.g. Read 2 books"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        {goalType === "monthly" ? (
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="goal-month">Month</label>

              <select
                id="goal-month"
                value={String(month)}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {MONTH_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {new Date(inputYear, value - 1, 1).toLocaleDateString(undefined, {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="goal-year">Year</label>
              <input
                id="goal-year"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="goal-year">Year</label>
                <input
                  id="goal-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="goal-target-month">Target month (optional)</label>

                <select
                  id="goal-target-month"
                  value={targetMonth ? String(targetMonth) : ""}
                  onChange={(event) =>
                    setTargetMonth(event.target.value ? Number(event.target.value) : "")
                  }
                >
                  <option value="">Any time</option>
                  {MONTH_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {new Date(inputYear, value - 1, 1).toLocaleDateString(undefined, {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
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

              <p className="form-hint">Optional — goals work without a category.</p>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="goal-progress">Progress — {progress}%</label>
            <input
              id="goal-progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="goal-notes">Notes</label>

          <textarea
            id="goal-notes"
            rows={3}
            placeholder="Why does this matter?"
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
            {loading ? "Saving..." : mode === "edit" ? "Save changes" : "Add goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalForm;