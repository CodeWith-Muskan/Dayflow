import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, History as HistoryIcon, Sparkles, TriangleAlert } from "lucide-react";

import ProgressBar from "../components/common/ProgressBar";
import EmptyState from "../components/common/EmptyState";
import { TaskListSkeleton } from "../components/common/Skeleton";

import { getWeeklyAnalytics } from "../services/analyticsService";

import { todayKey, addDays, formatDayKey, isTodayKey } from "../utils/dates";

const History = () => {
  const navigate = useNavigate();

  const today = todayKey();

  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const start = addDays(today, -60);

      const data = await getWeeklyAnalytics(start, today);

      // Past days only, newest first.
      const pastDays = data
        .filter((entry) => !isTodayKey(entry.date))
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      setDays(pastDays);
    } catch {
      setError("Unable to load your history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [today, setLoading, setError, setDays]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const totalTasksShown = useMemo(() => days.reduce((sum, day) => sum + day.totalTasks, 0), [days]);

  return (
    <div className="df-page history-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="page-head">
        <div>
          <span className="page-eyebrow">
            <HistoryIcon size={13} />
            HISTORY
          </span>
          <h1>History</h1>
          <p>Look back at your days, exactly as they were.</p>
        </div>
      </div>

      {error ? (
        <div className="error-state">
          <TriangleAlert size={22} />
          <p>{error}</p>
          <button type="button" className="df-btn secondary" onClick={() => setReloadKey((previous) => previous + 1)}>
            Try Again
          </button>
        </div>
      ) : loading ? (
        <TaskListSkeleton count={5} />
      ) : days.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No past days recorded yet."
          subtitle="Your future history will gently appear here."
        />
      ) : (
        <>
          {totalTasksShown === 0 && (
            <p className="history-note">Days with no tasks are still part of your story — add tasks to build your history.</p>
          )}

          <div className="history-list">
            {days.slice(0, 30).map((day, index) => (
              <button
                type="button"
                className="history-day"
                key={day.date}
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => navigate(`/tasks?date=${day.date}`)}
              >
                <div className="history-day-date">
                  <strong>{formatDayKey(day.date)}</strong>
                  <span>
                    {day.completedTasks} / {day.totalTasks} completed
                  </span>
                </div>

                <div className="history-day-progress">
                  <ProgressBar value={day.productivity} />
                  <span className="history-day-percent">{day.productivity}%</span>
                </div>

                <ChevronRight size={17} className="history-day-arrow" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;