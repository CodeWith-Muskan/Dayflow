import { useState } from "react";
import { ArrowLeft, CalendarDays, CalendarRange, Crosshair, Target } from "lucide-react";

import Modal from "../common/Modal";

import { addDays, formatKeyShort, formatKeyWeekday } from "../../utils/dates";

// Quick-plan modal: pick a planning horizon, then land in the right
// form with today / this week / this month / this year pre-filled.
const PlanModal = ({
  open,
  onClose,
  today,
  weekStart,
  onPickSchedule,
  onPickGoal,
}) => {
  const [step, setStep] = useState("type");

  const close = () => {
    setStep("type");
    onClose();
  };

  const pickSchedule = (date) => {
    setStep("type");
    onClose();
    onPickSchedule(date);
  };

  const pickGoal = (goalType) => {
    setStep("type");
    onClose();
    onPickGoal(goalType);
  };

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <Modal open={open} onClose={close} title="What do you want to plan?" size="sm">
      {step === "weekday" && (
        <div className="plan-step">
          <button
            type="button"
            className="plan-back"
            onClick={() => setStep("type")}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <p className="form-hint">This week — pick the day for your plan.</p>

          <div className="weekday-picker">
            {weekDays.map((key) => (
              <button
                type="button"
                key={key}
                className="weekday-cell"
                onClick={() => pickSchedule(key)}
              >
                <span>{formatKeyWeekday(key)}</span>
                <strong>{formatKeyShort(key)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "type" && (
        <div className="plan-grid">
          <button type="button" className="plan-choice" onClick={() => pickSchedule(today)}>
            <CalendarDays size={20} />
            <span>
              <strong>Daily schedule</strong>
              <em>Time-block today's plan</em>
            </span>
          </button>

          <button type="button" className="plan-choice" onClick={() => setStep("weekday")}>
            <CalendarRange size={20} />
            <span>
              <strong>Weekly plan</strong>
              <em>Block a day this week</em>
            </span>
          </button>

          <button type="button" className="plan-choice" onClick={() => pickGoal("monthly")}>
            <Target size={20} />
            <span>
              <strong>Monthly goal</strong>
              <em>Set a focus for the month</em>
            </span>
          </button>

          <button type="button" className="plan-choice" onClick={() => pickGoal("yearly")}>
            <Crosshair size={20} />
            <span>
              <strong>Yearly goal</strong>
              <em>Shape the whole year</em>
            </span>
          </button>
        </div>
      )}
    </Modal>
  );
};

export default PlanModal;