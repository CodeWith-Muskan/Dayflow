import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, Plus, Sparkles, TriangleAlert } from "lucide-react";

import TaskList from "../components/tasks/TaskList";
import TaskForm from "../components/tasks/TaskForm";
import CreateCategoryModal from "../components/tasks/CreateCategoryModal";
import ProgressBar from "../components/common/ProgressBar";
import EmptyState from "../components/common/EmptyState";
import { TaskListSkeleton } from "../components/common/Skeleton";

import { getTasks, createTask, updateTask, toggleTask, deleteTask } from "../services/taskService";
import { getCategories } from "../services/categoryService";

import { todayKey, addDays, isPastKey, isFutureKey, isTodayKey, formatDayKey } from "../utils/dates";

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = todayKey();
  const date = searchParams.get("date") || today;

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [creatorParentId, setCreatorParentId] = useState(null);

  const isPast = isPastKey(date);
  const isFuture = isFutureKey(date);
  const isToday = isTodayKey(date);

  const loadTasks = useCallback(async (dateKey) => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks(dateKey);
      setTasks(data);
    } catch {
      setError("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTasks]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // Categories are optional; the page still works without them.
    }
  }, [setCategories]);

  useEffect(() => {
    loadTasks(date);
  }, [date, loadTasks]);

  const goTo = (dateKey) => {
    setSearchParams(dateKey === today ? {} : { date: dateKey }, { replace: true });
  };

  const goToPreviousDay = () => goTo(addDays(date, -1));
  const goToNextDay = () => goTo(addDays(date, 1));
  const goToToday = () => goTo(today);

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const remaining = tasks.length - completedCount;

  const statusLabel = isPast ? "HISTORY" : isFuture ? "UPCOMING" : "TODAY";

  const handleCreate = async (payload) => {
    setSubmitting(true);

    try {
      const task = await createTask(payload);

      if (payload.date === date) {
        setTasks((previous) => [task, ...previous]);
      } else {
        goTo(payload.date);
      }

      setShowAdd(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);

    try {
      const updated = await updateTask(editingTask._id, payload);
      setTasks((previous) => previous.map((task) => (task._id === updated._id ? updated : task)));
      setEditingTask(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (task) => {
    setBusyId(task._id);

    const optimistic = { ...task, completed: !task.completed, completedAt: task.completed ? null : new Date().toISOString() };
    setTasks((previous) => previous.map((item) => (item._id === task._id ? optimistic : item)));

    try {
      const updated = await toggleTask(task._id);
      setTasks((previous) => previous.map((item) => (item._id === task._id ? updated : item)));
    } catch (err) {
      setTasks((previous) => previous.map((item) => (item._id === task._id ? task : item)));
      alert(err.response?.data?.message || "Could not update the task.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (task) => {
    try {
      await deleteTask(task._id);
      setTasks((previous) => previous.filter((item) => item._id !== task._id));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the task.");
    }
  };

  const openCategoryCreator = (parentId = null) => {
    setCreatorParentId(parentId);
    setShowCategoryCreator(true);
  };

  const handleCategoryCreated = (category) => {
    setCategories((previous) => {
      const exists = previous.some((item) => item._id === category._id);
      return exists ? previous : [...previous, category];
    });
  };

  const openAdd = () => {
    loadCategories();
    setShowAdd(true);
  };

  const openEdit = (task) => {
    loadCategories();
    setEditingTask(task);
  };

  const emptyCopy = useMemo(() => {
    if (isPast) {
      return {
        title: "No tasks were recorded for this day.",
        subtitle: "This day is part of your history.",
      };
    }

    if (isFuture) {
      return {
        title: "Nothing planned yet.",
        subtitle: "Give tomorrow something to look forward to.",
      };
    }

    return {
      title: "A quiet day.",
      subtitle: "Nothing planned yet.",
    };
  }, [isPast, isFuture]);

  const defaultValue = date;

  return (
    <div className="df-page tasks-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      {/* Date navigation */}
      <div className="date-nav">
        <button type="button" className="date-nav-arrow" onClick={goToPreviousDay} aria-label="Previous day">
          <ChevronLeft size={19} />
        </button>

        <div className="date-nav-center">
          <span className={`date-pill ${isPast ? "pill-history" : isFuture ? "pill-upcoming" : "pill-today"}`}>
            {statusLabel}
          </span>

          <button type="button" className="date-title" onClick={goToToday} title="Jump to today">
            {formatDayKey(date)}
          </button>

          <p className="date-subtitle">
            {isPast ? "A day from your past, kept exactly as it was." : isFuture ? "A day yet to come." : "This is where you are right now."}
          </p>
        </div>

        <button type="button" className="date-nav-arrow" onClick={goToNextDay} aria-label="Next day">
          <ChevronRight size={19} />
        </button>
      </div>

      {isPast && (
        <div className="lock-notice">
          <Lock size={15} />
          This day is locked and can only be viewed.
        </div>
      )}

      {/* Progress summary */}
      {!loading && !error && (
        <div className="summary-card">
          <div className="summary-top">
            <div>
              <span className="summary-label">Daily progress</span>
              <div className="summary-number">
                {completedCount} <span>/ {tasks.length} completed</span>
              </div>
            </div>

            <div className="summary-percent">{progress}%</div>
          </div>

          <ProgressBar value={progress} />

          {tasks.length > 0 && (
            <p className="summary-footer">
              {progress === 100 ? "Everything is complete." : `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="error-state">
          <TriangleAlert size={22} />
          <p>{error}</p>
          <button type="button" className="df-btn secondary" onClick={() => loadTasks(date)}>
            Try Again
          </button>
        </div>
      ) : loading ? (
        <TaskListSkeleton />
      ) : (
        <>
          <div className="section-head">
            <div>
              <h2>{isToday ? "Today's tasks" : isFuture ? "Planned tasks" : "Tasks from this day"}</h2>
              <p>
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={emptyCopy.title}
              subtitle={emptyCopy.subtitle}
              action={
                !isPast && (
                  <button type="button" className="df-btn primary" onClick={openAdd}>
                    <Plus size={16} />
                    {isToday ? "Add your first task" : "Add a task"}
                  </button>
                )
              }
            />
          ) : (
            <TaskList
              tasks={tasks}
              isReadOnly={isPast}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
              busyId={busyId}
            />
          )}
        </>
      )}

      {/* Add button */}
      {!isPast && !error && (
        <div className="add-task-wrap">
          <button type="button" className="df-btn primary add-task-button" onClick={openAdd}>
            <Plus size={17} />
            Add Task
          </button>
        </div>
      )}

      {/* Add / edit modals */}
      <TaskForm
        open={showAdd || !!editingTask}
        onClose={() => {
          setShowAdd(false);
          setEditingTask(null);
        }}
        mode={editingTask ? "edit" : "create"}
        task={editingTask}
        initialDate={defaultValue}
        categories={categories}
        onSubmit={editingTask ? handleEdit : handleCreate}
        onOpenCategoryCreator={() => openCategoryCreator(null)}
        onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
        loading={submitting}
      />

      {/* Inline category creation */}
      <CreateCategoryModal
        open={showCategoryCreator}
        onClose={() => setShowCategoryCreator(false)}
        categories={categories}
        defaultParentId={creatorParentId}
        onCreated={handleCategoryCreated}
      />
    </div>
  );
};

export default Tasks;