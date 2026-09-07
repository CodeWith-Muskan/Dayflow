import { CalendarCheck2, CalendarDays, Kanban, Layers } from "lucide-react";

// Lightweight strip at the top of the schedule page summarising the plan
// horizons: today, this week, this month, and this year.
const PlanSummary = ({ today, week, month, year }) => (
  <div className="plan-summary" aria-label="Plan summary">
    <div className="plan-summary-item">
      <CalendarDays size={15} />
      <span>
        <em>Today</em>
        <strong>{today}</strong>
      </span>
    </div>

    <div className="plan-summary-item">
      <Layers size={15} />
      <span>
        <em>This week</em>
        <strong>{week}</strong>
      </span>
    </div>

    <div className="plan-summary-item">
      <Kanban size={15} />
      <span>
        <em>This month</em>
        <strong>{month}</strong>
      </span>
    </div>

    <div className="plan-summary-item">
      <CalendarCheck2 size={15} />
      <span>
        <em>This year</em>
        <strong>{year}</strong>
      </span>
    </div>
  </div>
);

export default PlanSummary;