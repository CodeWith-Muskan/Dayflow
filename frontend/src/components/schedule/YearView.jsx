import {
  buildMonthGrid,
  isTodayKey,
  formatMonthShort,
} from "../../utils/dates";

// Year overview: 12 mini month cards. Click a month to open it,
// click a day to select it and jump to the month view.
const YearView = ({
  yearKey,
  today,
  analyticsByDate,
  schedulesByDate,
  selectedDate,
  onSelectMonth,
  onSelectDay,
}) => {
  const months = Array.from(
    { length: 12 },
    (_, index) => `${yearKey}-${String(index + 1).padStart(2, "0")}`
  );

  const hasActivity = (key) =>
    (analyticsByDate[key]?.totalTasks ?? 0) > 0 ||
    (schedulesByDate[key]?.length ?? 0) > 0;

  return (
    <div className="year-grid">
      {months.map((monthKey) => {
        const days = buildMonthGrid(monthKey)
          .flat()
          .filter((day) => day.inMonth);

        return (
          <div className="year-month" key={monthKey}>
            <button
              type="button"
              className="year-month-head"
              onClick={() => onSelectMonth(monthKey)}
              aria-label={`Open ${formatMonthShort(monthKey)}`}
            >
              <strong>{formatMonthShort(monthKey)}</strong>
            </button>

            <div className="year-days">
              {days.map(({ key, day }) => {
                const className = [
                  "year-dot",
                  isTodayKey(key, today) ? "today" : "",
                  key === selectedDate ? "selected" : "",
                  hasActivity(key) ? "has" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    type="button"
                    key={key}
                    className={className}
                    onClick={() => onSelectDay(key)}
                    aria-label={key}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearView;