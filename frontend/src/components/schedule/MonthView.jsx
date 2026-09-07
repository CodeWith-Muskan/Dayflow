import { buildMonthGrid, isTodayKey } from "../../utils/dates";

// Monthly grid. Each cell shows a task dot and a time-block count badge.
const MonthView = ({
  monthKey,
  today,
  analyticsByDate,
  schedulesByDate,
  selectedDate,
  onSelectDay,
}) => {
  const weeks = buildMonthGrid(monthKey);

  return (
    <div className="calendar-grid">
      {weeks.flat().map(({ key, day, inMonth }) => {
        const entry = analyticsByDate[key];
        const hasTasks = Boolean(entry) && entry.totalTasks > 0;
        const allComplete = hasTasks && entry.completedTasks === entry.totalTasks;
        const scheduleCount = schedulesByDate[key]?.length || 0;

        const className = [
          "calendar-cell",
          inMonth ? "" : "muted",
          isTodayKey(key, today) ? "today" : "",
          key === selectedDate ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            type="button"
            key={key}
            className={className}
            onClick={() => onSelectDay(key)}
            aria-label={`${key}${hasTasks ? `, ${entry.totalTasks} tasks` : ""}${
              scheduleCount ? `, ${scheduleCount} time blocks` : ""
            }`}
          >
            <span className="cell-day">{day}</span>

            <span className="cell-badges">
              {hasTasks && (
                <span className={`cell-dot ${allComplete ? "complete" : ""}`} />
              )}
              {scheduleCount > 0 && (
                <span className="cell-sched">
                  {scheduleCount > 9 ? "9+" : scheduleCount}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MonthView;