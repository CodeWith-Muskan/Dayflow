import { useCallback, useEffect, useState } from "react";
import { Clock, ExternalLink, Lock, Trash2 } from "lucide-react";

import Modal from "../common/Modal";
import ScheduleForm from "./ScheduleForm";
import DailyTimeline from "./DailyTimeline";

import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../services/scheduleService";

import { formatDayKey, isPastKey } from "../../utils/dates";

// Selected-day plan: a time-blocked timeline. Past days are read-only
// and can only be viewed.
const DayPanel = ({
  date,
  categories = [],
  onChanged,
  onOpenTasks,
  onOpenCategoryCreator,
  onOpenSubcategoryCreator,
  large = false,
  refreshToken = 0,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const readOnly = isPastKey(date);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSchedules(date);
      setItems(data);
    } catch {
      setError("Unable to load the schedule.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load, refreshKey, refreshToken]);

  const commit = (list) => {
    setItems(list);
    onChanged?.(date, list);
  };

  const handleCreate = async (payload) => {
    setSaving(true);

    try {
      const { schedule } = await createSchedule({ ...payload, date });
      commit([...items, schedule]);
      setFormOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Could not add the time block.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;

    setSaving(true);

    try {
      const { schedule } = await updateSchedule(editing._id, payload);
      commit(items.map((item) => (item._id === schedule._id ? schedule : item)));
      setEditing(null);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update the time block.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteSchedule(confirmDelete._id);
      commit(items.filter((item) => item._id !== confirmDelete._id));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the time block.");
    }
  };

  const openForm = (item = null) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className={`day-panel ${large ? "day-panel-large" : ""}`}>
      <div className="day-panel-head">
        <div>
          <span className="page-eyebrow">
            <Clock size={13} />
            DAY PLAN
          </span>

          <h2>{formatDayKey(date)}</h2>

          {readOnly && (
            <span className="lock-chip">
              <Lock size={12} />
              Past days are read-only
            </span>
          )}
        </div>

        <button type="button" className="df-btn secondary" onClick={onOpenTasks}>
          <ExternalLink size={15} />
          Open in tasks
        </button>
      </div>

      <DailyTimeline
        date={date}
        items={items}
        loading={loading}
        error={error}
        onRetry={() => setRefreshKey((key) => key + 1)}
        onAdd={() => openForm(null)}
        onEdit={(item) => openForm(item)}
        onDelete={(item) => setConfirmDelete(item)}
      />

      <ScheduleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={editing ? "edit" : "create"}
        item={editing}
        categories={categories}
        onSubmit={editing ? handleUpdate : handleCreate}
        onOpenCategoryCreator={onOpenCategoryCreator}
        onOpenSubcategoryCreator={onOpenSubcategoryCreator}
        loading={saving}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete time block?" size="sm">
        <p className="confirm-text">
          "{confirmDelete?.title}" will be removed from {formatDayKey(date)}.
        </p>

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

export default DayPanel;