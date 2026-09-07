import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";

import MonthView from "../components/schedule/MonthView";
import WeekView from "../components/schedule/WeekView";
import YearView from "../components/schedule/YearView";
import DayPanel from "../components/schedule/DayPanel";
import PlanSummary from "../components/schedule/PlanSummary";
import PlanModal from "../components/schedule/PlanModal";
import ScheduleForm from "../components/schedule/ScheduleForm";
import CreateCategoryModal from "../components/tasks/CreateCategoryModal";

import MonthlyGoals from "../components/goals/MonthlyGoals";
import YearlyGoals from "../components/goals/YearlyGoals";
import GoalForm from "../components/goals/GoalForm";

import { getMonthlyAnalytics, getWeeklyAnalytics } from "../services/analyticsService";
import { getSchedulesInRange, createSchedule } from "../services/scheduleService";
import { createMonthlyGoal, createYearlyGoal } from "../services/goalService";
import { getCategories } from "../services/categoryService";

import {
  todayKey,
  addDays,
  addWeeks,
  endOfWeekKey,
  shiftMonth,
  shiftYear,
  startOfWeekKey,
  monthKeyOf,
  monthStartKey,
  monthEndKey,
  yearKeyOf,
  formatDayKey,
  formatMonthLabel,
  formatWeekRange,
} from "../utils/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const VIEWS = ["day", "week", "month", "year"];

const groupByDate = (schedules) =>
  schedules.reduce((map, item) => {
    (map[item.date] = map[item.date] || []).push(item);
    return map;
  }, {});

const Schedule = () => {
  const navigate = useNavigate();
  const today = todayKey();
  const todayMonth = monthKeyOf(today);
  const todayWeekStart = startOfWeekKey(today);

  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState(today);

  const [analyticsByDate, setAnalyticsByDate] = useState({});
  const [schedulesByDate, setSchedulesByDate] = useState({});
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [creatorParentId, setCreatorParentId] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [quickScheduleDate, setQuickScheduleDate] = useState(null);
  const [quickGoalType, setQuickGoalType] = useState(null);
  const [quickSaving, setQuickSaving] = useState(false);

  const [monthlyGoalCount, setMonthlyGoalCount] = useState(0);
  const [yearlyGoalCount, setYearlyGoalCount] = useState(0);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch {
      // Categories are optional; the timetable still works without them.
    }
  }, [setCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const normalizeCursor = (nextView, anchor) => {
    if (nextView === "day") return anchor;
    if (nextView === "month") return monthKeyOf(anchor);
    if (nextView === "week") return startOfWeekKey(anchor);
    return yearKeyOf(anchor);
  };

  const switchView = (nextView) => {
    setCursor(normalizeCursor(nextView, selectedDate));
    setView(nextView);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let analyticsPromise;
      let start;
      let end;

      if (view === "day") {
        start = startOfWeekKey(cursor);
        end = endOfWeekKey(cursor);
        analyticsPromise = getWeeklyAnalytics(start, end);
      } else if (view === "month") {
        start = monthStartKey(cursor);
        end = monthEndKey(cursor);
        analyticsPromise = getMonthlyAnalytics(cursor);
      } else if (view === "week") {
        start = cursor;
        end = endOfWeekKey(cursor);
        analyticsPromise = getWeeklyAnalytics(start, end);
      } else {
        start = `${cursor}-01-01`;
        end = `${cursor}-12-31`;
        analyticsPromise = getWeeklyAnalytics(start, end);
      }

      const [analytics, schedules] = await Promise.all([
        analyticsPromise,
        getSchedulesInRange(start, end),
      ]);

      setAnalyticsByDate(
        Object.fromEntries(analytics.map((entry) => [entry.date, entry]))
      );
      setSchedulesByDate(groupByDate(schedules));
    } catch {
      setError("Unable to load the calendar.");
    } finally {
      setLoading(false);
    }
  }, [view, cursor, setAnalyticsByDate, setSchedulesByDate]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const selectDate = (key) => {
    setSelectedDate(key);

    if (view === "month" && monthKeyOf(key) !== cursor) {
      setCursor(monthKeyOf(key));
    } else if (view === "week" && startOfWeekKey(key) !== cursor) {
      setCursor(startOfWeekKey(key));
    } else if (view === "day" && key !== cursor) {
      setCursor(key);
    }
  };

  const selectMonth = (monthKey) => {
    setCursor(monthKey);
    setView("month");
  };

  const openDayFromYear = (key) => {
    setSelectedDate(key);
    setCursor(monthKeyOf(key));
    setView("month");
  };

  const jumpToToday = () => {
    setCursor(normalizeCursor(view, today));
    setSelectedDate(today);
  };

  const step = (direction) => {
    if (view === "month") setCursor((current) => shiftMonth(current, direction));
    else if (view === "week") setCursor((current) => addWeeks(current, direction));
    else if (view === "day") setCursor((current) => addDays(current, direction));
    else setCursor((current) => shiftYear(current, direction));
  };

  const headerTitle =
    view === "day"
      ? formatDayKey(cursor)
      : view === "month"
      ? formatMonthLabel(cursor)
      : view === "week"
      ? formatWeekRange(cursor)
      : cursor;

  const isCurrent =
    view === "day"
      ? cursor === today
      : view === "month"
      ? cursor === todayMonth
      : view === "week"
      ? monthKeyOf(cursor) === todayMonth
      : cursor === yearKeyOf(today);

  // Summary strip counts.
  const todayBlocks = schedulesByDate[today]?.length || 0;
  const weekBlocks = Array.from({ length: 7 }, (_, index) =>
    addDays(todayWeekStart, index)
  ).reduce((total, key) => total + (schedulesByDate[key]?.length || 0), 0);

  const openCategoryCreator = (parentId = null) => {
    setCreatorParentId(parentId);
    setShowCategoryCreator(true);
  };

  const handleCategoryCreated = (category) => {
    setCategories((previous) =>
      previous.some((item) => item._id === category._id)
        ? previous
        : [...previous, category]
    );
  };

  const syncPanel = (date, list) => {
    setSchedulesByDate((previous) => ({ ...previous, [date]: list }));
  };

  const handleQuickSchedule = async (payload) => {
    if (!quickScheduleDate) return;

    setQuickSaving(true);

    try {
      const { schedule } = await createSchedule({ ...payload, date: quickScheduleDate });
      const list = [...(schedulesByDate[quickScheduleDate] || []), schedule];
      setSchedulesByDate((previous) => ({
        ...previous,
        [quickScheduleDate]: list,
      }));
      setQuickScheduleDate(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Could not add the time block.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickGoal = async (payload) => {
    if (!quickGoalType) return;

    setQuickSaving(true);

    try {
      if (quickGoalType === "monthly") {
        await createMonthlyGoal(payload);
      } else {
        await createYearlyGoal(payload);
      }
      setQuickGoalType(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Could not add the goal.");
    } finally {
      setQuickSaving(false);
    }
  };

  const todayYear = Number(today.slice(0, 4));
  const todayMonthNumber = Number(today.slice(5, 7));

  return (
    <div className="df-page schedule-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="page-head">
        <div>
          <span className="page-eyebrow">
            <CalendarDays size={13} />
            SCHEDULE
          </span>
          <h1>Schedule</h1>
          <p>Plan your days, weeks, months, and years.</p>
        </div>

        <button
          type="button"
          className="df-btn primary"
          onClick={() => setShowPlanModal(true)}
        >
          <Plus size={16} />
          Plan
        </button>
      </div>

      <PlanSummary
        today={todayBlocks}
        week={weekBlocks}
        month={monthlyGoalCount}
        year={yearlyGoalCount}
      />

      <div className="view-switcher" role="tablist" aria-label="Calendar view">
        {VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            className={`view-pill ${view === option ? "active" : ""}`}
            onClick={() => switchView(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="calendar-card">
        <div className="calendar-head">
          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => step(-1)}
            aria-label="Previous"
          >
            <ChevronLeft size={19} />
          </button>

          <div className="calendar-title">
            <h2>{headerTitle}</h2>

            {!isCurrent && (
              <button type="button" className="text-button" onClick={jumpToToday}>
                Jump to today
              </button>
            )}
          </div>

          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => step(1)}
            aria-label="Next"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        {error && view !== "day" ? (
          <div className="error-state">
            <p>{error}</p>
            <button
              type="button"
              className="df-btn secondary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try Again
            </button>
          </div>
        ) : view === "day" ? (
          <DayPanel
            large
            date={cursor}
            categories={categories}
            refreshToken={reloadKey}
            onChanged={syncPanel}
            onOpenTasks={() => navigate(`/tasks?date=${cursor}`)}
            onOpenCategoryCreator={() => openCategoryCreator(null)}
            onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
          />
        ) : loading ? (
          <div className="calendar-loading">
            <div className="loading-spinner" />
          </div>
        ) : view === "month" ? (
          <>
            <div className="calendar-weekdays">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <MonthView
              monthKey={cursor}
              today={today}
              analyticsByDate={analyticsByDate}
              schedulesByDate={schedulesByDate}
              selectedDate={selectedDate}
              onSelectDay={selectDate}
            />

            <div className="calendar-legend">
              <span>
                <span className="legend-dot plain" /> tasks
              </span>
              <span>
                <span className="legend-sched-chip">1</span> time blocks
              </span>
              <span>
                <span className="legend-dot complete" /> all done
              </span>
              <span>
                <span className="legend-dot today-dot" /> today
              </span>
            </div>
          </>
        ) : view === "week" ? (
          <WeekView
            weekStart={cursor}
            today={today}
            analyticsByDate={analyticsByDate}
            schedulesByDate={schedulesByDate}
            selectedDate={selectedDate}
            onSelectDay={selectDate}
          />
        ) : (
          <YearView
            yearKey={cursor}
            today={today}
            analyticsByDate={analyticsByDate}
            schedulesByDate={schedulesByDate}
            selectedDate={selectedDate}
            onSelectMonth={selectMonth}
            onSelectDay={openDayFromYear}
          />
        )}
      </div>

      {view !== "day" && (
        <DayPanel
          date={selectedDate}
          categories={categories}
          refreshToken={reloadKey}
          onChanged={syncPanel}
          onOpenTasks={() => navigate(`/tasks?date=${selectedDate}`)}
          onOpenCategoryCreator={() => openCategoryCreator(null)}
          onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
        />
      )}

      {view === "month" && (
        <MonthlyGoals
          monthKey={cursor}
          refreshToken={reloadKey}
          onChanged={(total) => setMonthlyGoalCount(total)}
        />
      )}

      {view === "year" && (
        <YearlyGoals
          year={Number(cursor)}
          categories={categories}
          refreshToken={reloadKey}
          onChanged={(total) => setYearlyGoalCount(total)}
          onOpenCategoryCreator={() => openCategoryCreator(null)}
          onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
        />
      )}

      {(view === "week" || view === "year") && (
        <div className="calendar-hint">
          <Sparkles size={15} />
          <span>
            {view === "year"
              ? "Pick a month or a day to dive in."
              : "Click any day to plan its time blocks."}
          </span>
        </div>
      )}

      <PlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        today={today}
        weekStart={todayWeekStart}
        onPickSchedule={(date) => setQuickScheduleDate(date)}
        onPickGoal={(goalType) => setQuickGoalType(goalType)}
      />

      <ScheduleForm
        open={Boolean(quickScheduleDate)}
        onClose={() => setQuickScheduleDate(null)}
        mode="create"
        categories={categories}
        onSubmit={handleQuickSchedule}
        onOpenCategoryCreator={() => openCategoryCreator(null)}
        onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
        loading={quickSaving}
      />

      <GoalForm
        open={Boolean(quickGoalType)}
        onClose={() => setQuickGoalType(null)}
        goalType={quickGoalType || "monthly"}
        mode="create"
        defaultMonth={todayMonthNumber}
        defaultYear={todayYear}
        categories={categories}
        onOpenCategoryCreator={() => openCategoryCreator(null)}
        onOpenSubcategoryCreator={(parent) => openCategoryCreator(parent?._id || null)}
        onSubmit={handleQuickGoal}
        loading={quickSaving}
      />

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

export default Schedule;