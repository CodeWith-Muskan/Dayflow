import { addDays, formatKeyShort, formatKeyWeekday, isTodayKey } from "../../utils/dates";

// Weekly grid. Each column is a day with its time blocks.
const WeekView = ({
  weekStart,
  today,
  analyticsByDate,
  schedulesByDate,
  selectedDate,
  onSelectDay,
}) => {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className="week-grid">
      {days.map((key) => {
        const entry = analyticsByDate[key];
        const items = schedulesByDate[key] || [];
        const count = entry?.totalTasks ?? 0;

        const className = [
          "week-col",
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
            aria-label={`${key}, ${count} tasks, ${items.length} time blocks`}
          >
            <span className="week-col-head">
              <span className="week-col-weekday">{formatKeyWeekday(key)}</span>
              <span className="week-col-day">{formatKeyShort(key)}</span>
              {count > 0 && (
                <span className="week-col-count">
                  {count} {count === 1 ? "task" : "tasks"}
                </span>
              )}
            </span>

            <span className="week-col-body">
              {items.length === 0 ? (
                <span className="week-col-empty">No time blocks</span>
              ) : (
                items.map((item) => (
                  <span className="week-block" key={item._id}>
                    <span className="week-block-time">
                      {item.startTime}
                      {item.endTime ? ` – ${item.endTime}` : ""}
                    </span>
                    <span className="week-block-title">{item.title}</span>
                  </span>
                ))
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default WeekView;