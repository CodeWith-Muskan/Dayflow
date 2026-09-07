import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Target, Trash2 } from "lucide-react";

import Modal from "../common/Modal";
import GoalForm from "./GoalForm";

import {
  getMonthlyGoals,
  createMonthlyGoal,
  updateMonthlyGoal,
  deleteMonthlyGoal,
} from "../../services/goalService";

import { formatMonthLabel } from "../../utils/dates";

// Monthly goals card for the month planner.
const MonthlyGoals = ({ monthKey, onChanged, refreshToken = 0 }) => {
  const year = Number(monthKey?.slice(0, 4)) || new Date().getFullYear();
  const month = Number(monthKey?.slice(5, 7)) || 1;

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMonthlyGoals(year, month);
      setGoals(data);
      onChanged?.(data.length, data.filter((goal) => goal.completed).length);
    } catch {
      setError("Unable to load monthly goals.");
    } finally {
      setLoading(false);
    }
  }, [year, month, onChanged]);

  useEffect(() => {
    load();
  }, [load, refreshKey, refreshToken]);

  const openForm = (goal = null) => {
    setEditing(goal);
    setFormOpen(true);
  };

  const handleCreate = async (payload) => {
    setSaving(true);

    try {
      const { goal } = await createMonthlyGoal(payload);
      setGoals((previous) => [...previous, goal].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      setFormOpen(false);
      onChanged?.(goals.length + 1, goals.filter((goal) => goal.completed).length);
    } catch (err) {
      alert(err.response?.data?.message || "Could not add the goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;

    setSaving(true);

    try {
      const { goal } = await updateMonthlyGoal(editing._id, payload);
      setGoals((previous) =>
        previous.map((item) => (item._id === goal._id ? goal : item))
      );
      setEditing(null);
      onChanged?.(goals.length, goals.filter((goal) => goal.completed).length);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update the goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (goal) => {
    const completed = !goal.completed;
    const progress = completed ? 100 : goal.progress;

    try {
      const { goal: updated } = await updateMonthlyGoal(goal._id, { completed, progress });
      const next = goals.map((item) => (item._id === updated._id ? updated : item));
      setGoals(next);
      onChanged?.(
        next.length,
        next.filter((item) => item.completed).length
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update the goal.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteMonthlyGoal(confirmDelete._id);
      const remaining = goals.filter((goal) => goal._id !== confirmDelete._id);
      setGoals(remaining);
      setConfirmDelete(null);
      onChanged?.(
        remaining.length,
        remaining.filter((goal) => goal.completed).length
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the goal.");
    }
  };

  const completedCount = goals.filter((goal) => goal.completed).length;

  return (
    <div className="goals-card">
      <div className="goals-head">
        <div>
          <span className="page-eyebrow">
            <Target size={13} />
            MONTHLY GOALS
          </span>

          <h2>{formatMonthLabel(monthKey)}</h2>

          {goals.length > 0 && (
            <span className="goals-progress-label">
              {completedCount} of {goals.length} done
            </span>
          )}
        </div>

        <button type="button" className="df-btn secondary" onClick={() => openForm(null)}>
          <Plus size={16} />
          Add goal
        </button>
      </div>

      {goals.length > 0 && (
        <div className="goals-progress-track">
          <span
            className="goals-progress-fill"
            style={{ width: `${goals.length ? (completedCount / goals.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button type="button" className="df-btn secondary" onClick={() => setRefreshKey((key) => key + 1)}>
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="day-panel-loading">
          <div className="loading-spinner small" />
        </div>
      ) : goals.length === 0 ? (
        <div className="goals-empty">
          <Target size={22} />
          <p>No goals for this month yet. Add one to give the month a focus.</p>
        </div>
      ) : (
        <ul className="goals-list">
          {goals.map((goal) => (
            <li
              className={`goal-row ${goal.completed ? "completed" : ""}`}
              key={goal._id}
            >
              <button
                type="button"
                className="goal-check"
                title={goal.completed ? "Mark as not done" : "Mark as done"}
                onClick={() => handleToggle(goal)}
              >
                {goal.completed ? <Check size={14} /> : null}
              </button>

              <div className="goal-body">
                <strong className="goal-title">{goal.title}</strong>

                {goal.description && <p className="goal-desc">{goal.description}</p>}

                {!goal.completed && goal.progress > 0 && (
                  <span className="goal-progress">
                    <span className="goal-progress-bar">
                      <span style={{ width: `${goal.progress}%` }} />
                    </span>
                    <em>{goal.progress}%</em>
                  </span>
                )}
              </div>

              <span className="goal-actions">
                <button
                  type="button"
                  className="task-action"
                  title="Edit goal"
                  onClick={() => openForm(goal)}
                >
                  <Pencil size={14} />
                </button>

                <button
                  type="button"
                  className="task-action danger"
                  title="Delete goal"
                  onClick={() => setConfirmDelete(goal)}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        goalType="monthly"
        mode={editing ? "edit" : "create"}
        goal={editing}
        defaultMonth={month}
        defaultYear={year}
        onSubmit={editing ? handleUpdate : handleCreate}
        loading={saving}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete goal?" size="sm">
        <p className="confirm-text">"{confirmDelete?.title}" will be removed.</p>

        <div className="modal-footer-inner">
          <button type="button" className="df-btn secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </button>

          <button type="button" className="df-btn danger" onClick={handleDelete}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MonthlyGoals;