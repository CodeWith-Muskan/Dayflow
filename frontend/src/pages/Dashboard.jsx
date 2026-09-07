import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ListTodo, Plus, Sparkles } from "lucide-react";

import TaskList from "../components/tasks/TaskList";
import ProgressBar from "../components/common/ProgressBar";
import EmptyState from "../components/common/EmptyState";
import { TaskListSkeleton } from "../components/common/Skeleton";

import { getTasks, toggleTask, deleteTask } from "../services/taskService";
import { useAuth } from "../context/AuthContext";

import { todayKey, formatDayKey, greeting } from "../utils/dates";

const Dashboard = () => {
  const { user } = useAuth();

  const today = todayKey();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTasks(today);
      setTasks(data);
    } catch {
      setError("Unable to load your day.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const nextUp = tasks.filter((task) => !task.completed);

  const firstName = user?.name?.split(" ")[0] || "there";

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

  return (
    <div className="df-page dashboard-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="dashboard-greeting">
        <div>
          <h1>
            {greeting()}, {firstName}.
          </h1>
          <p>{formatDayKey(today)}</p>
        </div>

        <Link to="/tasks" className="df-btn primary">
          <Plus size={16} />
          Add task
        </Link>
      </div>

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button type="button" className="df-btn secondary" onClick={loadTasks}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="summary-card hero">
              <div className="summary-top">
                <div>
                  <span className="summary-label">Today's progress</span>
                  <div className="summary-number">
                    {completedCount} <span>/ {tasks.length} completed</span>
                  </div>
                </div>

                <div className="summary-percent">{progress}%</div>
              </div>

              <ProgressBar value={progress} />

              <p className="summary-footer">
                {tasks.length === 0
                  ? "A quiet day, ready for your intentions."
                  : progress === 100
                  ? "Everything is complete."
                  : `${tasks.length - completedCount} ${tasks.length - completedCount === 1 ? "task" : "tasks"} to go`}
              </p>

              <Link to="/tasks" className="inline-link">
                View all tasks <ArrowRight size={14} />
              </Link>
            </div>

            <div className="next-up-card">
              <div className="next-up-head">
                <span className="summary-label">Next up</span>
                <ListTodo size={17} />
              </div>

              {loading ? (
                <TaskListSkeleton count={2} />
              ) : nextUp.length === 0 ? (
                <div className="next-up-empty">
                  <span className="next-up-orb">
                    <Sparkles size={16} />
                  </span>
                  <p>{tasks.length === 0 ? "Nothing planned today." : "All caught up. Lovely."}</p>
                </div>
              ) : (
                <div className="compact-list">
                  {nextUp.slice(0, 4).map((task) => (
                    <div className="compact-row" key={task._id}>
                      <button
                        type="button"
                        className={`task-check ${task.completed ? "checked" : ""}`}
                        onClick={() => handleToggle(task)}
                        disabled={busyId === task._id}
                      >
                        <CheckIcon size={14} />
                      </button>
                      <span className="compact-title">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-head">
            <div>
              <h2>Today's tasks</h2>
              <p>
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"} on this day
              </p>
            </div>
          </div>

          {loading ? (
            <TaskListSkeleton count={3} />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="A quiet day."
              subtitle="Nothing planned yet. Give today a gentle start."
              action={
                <Link to="/tasks" className="df-btn primary">
                  <Plus size={16} />
                  Add your first task
                </Link>
              }
            />
          ) : (
            <TaskList tasks={tasks} onToggle={handleToggle} onEdit={() => {}} onDelete={handleDelete} busyId={busyId} />
          )}
        </>
      )}
    </div>
  );
};

const CheckIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default Dashboard;