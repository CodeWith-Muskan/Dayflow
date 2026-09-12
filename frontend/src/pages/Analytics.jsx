import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  Flame,
  Layers,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

import ProgressBar from "../components/common/ProgressBar";
import { StatsSkeleton } from "../components/common/Skeleton";
import { useTheme } from "../context/ThemeContext";

import {
  getOverallAnalytics,
  getWeeklyAnalytics,
  getCategoryAnalytics,
  getCategoryOverTime,
  getStreaks,
} from "../services/analyticsService";

import { todayKey, addDays, formatKeyShort } from "../utils/dates";
import { resolveColor } from "../utils/colors";

const PRESETS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

const rangeDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end - start) / 86400000) + 1;
};

const Analytics = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const today = todayKey();

  const [preset, setPreset] = useState("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [compare, setCompare] = useState(false);

  const [overall, setOverall] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [rangeData, setRangeData] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [categoryOverTime, setCategoryOverTime] = useState({ categories: [], series: [] });
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const { startDate, endDate } = useMemo(() => {
    if (usingCustom) {
      return { startDate: customStart || today, endDate: customEnd || today };
    }
    const presetDays = PRESETS.find((p) => p.key === preset)?.days ?? 7;
    return { startDate: addDays(today, -(presetDays - 1)), endDate: today };
  }, [usingCustom, customStart, customEnd, preset, today]);

  const comparisonStart = useMemo(
    () => startDate && endDate ? addDays(startDate, -rangeDays(startDate, endDate)) : null,
    [startDate, endDate]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const calls = [
        getOverallAnalytics(),
        getStreaks(today),
        getWeeklyAnalytics(startDate, endDate),
        getCategoryOverTime(startDate, endDate),
        getCategoryAnalytics(),
      ];

      if (compare && comparisonStart) {
        calls.push(getWeeklyAnalytics(comparisonStart, addDays(startDate, -1)));
      }

      const [overallData, streaksData, range, categorySeries, categoryTotals, previousRange] =
        await Promise.all(calls);

      setOverall(overallData);
      setStreaks(streaksData);
      setRangeData(range);
      setCompareData(previousRange || []);
      setCategoryOverTime(categorySeries);
      setCategories(categoryTotals);
    } catch {
      setError("Unable to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [today, startDate, endDate, compare, comparisonStart]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const dayCount = rangeDays(startDate, endDate);
  const isLongRange = dayCount > 31;
  const [chartMode, setChartMode] = useState(isLongRange ? "rate" : "bar");

  useEffect(() => {
    setChartMode(isLongRange ? "rate" : "bar");
  }, [isLongRange]);

  const hintClick = (dateKey) => navigate(`/tasks?date=${dateKey}`);

  const chartClick = (state, source) => {
    const index = state?.activeIndex;
    const sourcePoint = source[index];
    if (sourcePoint && sourcePoint.dateKey) hintClick(sourcePoint.dateKey);
  };

  const mainChart = useMemo(() => {
    return Array.from({ length: dayCount }, (_, index) => {
      const dateKey = addDays(startDate, index);
      const entry = rangeData.find((item) => item.date === dateKey);
      return {
        dateKey,
        label: formatKeyShort(dateKey),
        productivity: entry?.productivity ?? 0,
        totalTasks: entry?.totalTasks ?? 0,
        completedTasks: entry?.completedTasks ?? 0,
        incompleteTasks: entry ? entry.incompleteTasks : 0,
      };
    });
  }, [startDate, dayCount, rangeData]);

  const rateSeries = useMemo(() => {
    const seriesMap = {};
    rangeData.forEach((row) => {
      seriesMap[row.date] = row;
    });
    return mainChart.map((point) => {
      const row = seriesMap[point.dateKey] || {};
      return {
        dateKey: point.dateKey,
        label: point.label,
        productivity: row.productivity ?? 0,
      };
    });
  }, [rangeData, mainChart]);

  const comparisonRateSeries = useMemo(() => {
    if (!compare || !comparisonStart) return [];
    const seriesMap = {};
    compareData.forEach((row) => {
      seriesMap[row.date] = row;
    });
    return mainChart.map((point) => {
      const dateKey = addDays(comparisonStart, mainChart.indexOf(point));
      const row = seriesMap[dateKey] || {};
      return {
        dateKey,
        label: point.label,
        productivity: row.productivity ?? 0,
      };
    });
  }, [compare, comparisonStart, compareData, mainChart]);

  const categorySeries = useMemo(() => {
    const { categories: metas, series } = categoryOverTime;
    if (!metas || !series || metas.length === 0) return { categories: [], series: [], data: [] };
    const seriesMap = {};
    series.forEach((row) => {
      seriesMap[row.date] = row;
    });
    return {
      categories: metas,
      data: mainChart.map((point) => {
        const row = seriesMap[point.dateKey] || {};
        const entry = { dateKey: point.dateKey, label: point.label };
        metas.forEach((meta) => {
          entry[meta._id] = row[meta._id] ?? 0;
        });
        return entry;
      }),
    };
  }, [categoryOverTime, mainChart]);

  const accentColor = resolveColor("lavender", theme);
  const blueColor = resolveColor("blue", theme);
  const compareColor = resolveColor("sage", theme);
  const tooltipTheme =
    theme === "night"
      ? { background: "#262735", border: "1px solid rgba(255,255,255,0.1)", color: "#F3F0F6" }
      : { background: "#fff", border: "1px solid #E9E6E3", color: "#29272A" };
  const gridStroke = theme === "night" ? "rgba(255,255,255,0.06)" : "rgba(41,39,42,0.06)";
  const tickFill = "var(--text-secondary)";

  const stats = useMemo(() => {
    if (!overall && rangeData.length === 0) return [];

    const totalCompleted = rangeData.reduce((sum, d) => sum + (d.completedTasks || 0), 0);
    const totalTasks = rangeData.reduce((sum, d) => sum + (d.totalTasks || 0), 0);
    const avgProductivity = totalTasks
      ? Math.round((totalCompleted / totalTasks) * 100)
      : 0;

    return [
      { label: "Total tasks", value: overall?.totalTasks ?? 0, icon: Layers, sub: `${totalTasks} in range` },
      { label: "Completed", value: overall?.completedTasks ?? 0, icon: Target, sub: `${totalCompleted} in range` },
      { label: "Completion rate", value: `${avgProductivity}%`, icon: BarChart3, sub: "avg over range" },
      { label: "Best streak", value: streaks?.bestStreak ?? 0, icon: Flame, sub: `${streaks?.currentStreak ?? 0} day current streak` },
    ];
  }, [overall, rangeData, streaks]);

  const applyPreset = (key) => {
    setUsingCustom(false);
    setPreset(key);
  };

  const applyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      setUsingCustom(true);
    }
  };

  return (
    <div className="df-page analytics-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="page-head">
        <div>
          <span className="page-eyebrow">
            <Sparkles size={13} />
            ANALYTICS
          </span>
          <h1>Analytics</h1>
          <p>Capture the shape of your effort.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-presets">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.key}
              className={`filter-pill ${!usingCustom && preset === p.key ? "active" : ""}`}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={`filter-pill ${usingCustom ? "active" : ""}`}
            onClick={() => setUsingCustom(true)}
          >
            Custom
          </button>
        </div>

        <div className="filter-range">
          <div className="filter-dates">
            <input
              type="date"
              value={customStart || startDate}
              max={customEnd || endDate}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setUsingCustom(true);
              }}
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd || endDate}
              min={customStart || startDate}
              max={today}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setUsingCustom(true);
              }}
            />
          </div>
          <button type="button" className="df-btn tiny secondary" onClick={applyCustom}>
            Apply
          </button>
          <label className="filter-compare">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            <span>Compare previous period</span>
          </label>
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
        <>
          <StatsSkeleton count={4} />
          <div className="chart-skeleton-grid">
            <div className="skeleton skeleton-chart" />
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div className="stat-card" key={stat.label} style={{ animationDelay: `${index * 60}ms` }}>
                  <span className="stat-icon">
                    <Icon size={18} />
                  </span>

                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-sub">{stat.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="chart-card">
            <div className="chart-card-head">
              <div className="chart-card-titles">
                <h3>
                  <CalendarRange size={15} />
                  {formatKeyShort(startDate)} – {formatKeyShort(endDate)}
                </h3>
                <span>{dayCount} day{dayCount === 1 ? "" : "s"} · click a point to open that day</span>
              </div>
              <div className="chart-type-toggle">
                <button
                  type="button"
                  className={chartMode === "bar" ? "active" : ""}
                  onClick={() => setChartMode("bar")}
                >
                  Volume
                </button>
                <button
                  type="button"
                  className={chartMode === "rate" ? "active" : ""}
                  onClick={() => setChartMode("rate")}
                >
                  Rate
                </button>
              </div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                {chartMode === "bar" ? (
                  <BarChart data={mainChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onClick={(state) => chartClick(state, mainChart)}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: theme === "night" ? "rgba(255,255,255,0.04)" : "rgba(41,39,42,0.04)" }} contentStyle={tooltipTheme} />
                    <Bar dataKey="completedTasks" name="Completed" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={26} fill={accentColor} />
                    <Bar
                      dataKey="incompleteTasks"
                      name="Incomplete"
                      stackId="a"
                      radius={[4, 4, 4, 4]}
                      maxBarSize={26}
                      fill={blueColor}
                      fillOpacity={0.4}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={rateSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onClick={(state) => chartClick(state, rateSeries)}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} interval={Math.max(0, Math.floor(dayCount / 10) - 1)} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip cursor={{ stroke: accentColor }} contentStyle={tooltipTheme} />
                    {compare && (
                      <Line
                        type="monotone"
                        data={comparisonRateSeries}
                        dataKey="productivity"
                        name="Previous"
                        stroke={compareColor}
                        strokeWidth={1.5}
                        strokeDasharray="5 4"
                        dot={false}
                      />
                    )}
                    <Line type="monotone" dataKey="productivity" name="Daily completion %" stroke={accentColor} strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section-head">
            <div>
              <h2>By category</h2>
              <p>Tasks completed per day, per category.</p>
            </div>
          </div>

          {categorySeries.categories.length === 0 ? (
            <div className="error-state subtle">
              <Layers size={20} />
              <p>Assign tasks to categories to see breakdowns.</p>
            </div>
          ) : categorySeries.categories.length === 1 ? (
            <div className="chart-card">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={categorySeries.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onClick={(state) => chartClick(state, categorySeries.data)}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} interval={Math.max(0, Math.floor(dayCount / 10) - 1)} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: accentColor }} contentStyle={tooltipTheme} />
                    <Line
                      type="monotone"
                      dataKey={categorySeries.categories[0]._id}
                      name={categorySeries.categories[0].name}
                      stroke={resolveColor(categorySeries.categories[0].color || "lavender", theme)}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="chart-card">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={categorySeries.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onClick={(state) => chartClick(state, categorySeries.data)}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} interval={Math.max(0, Math.floor(dayCount / 10) - 1)} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: accentColor }} contentStyle={tooltipTheme} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {categorySeries.categories.map((meta) => (
                      <Line
                        key={meta._id}
                        type="monotone"
                        dataKey={meta._id}
                        name={meta.name}
                        stroke={resolveColor(meta.color || "lavender", theme)}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <>
              <div className="section-head">
                <div>
                  <h2>By category totals</h2>
                  <p>Including direct tasks and subcategory tasks.</p>
                </div>
              </div>

              <div className="category-analysis">
                {categories.map((category) => (
                  <CategoryRow key={category._id} category={category} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const CategoryRow = ({ category }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = category.subcategories && category.subcategories.length > 0;

  return (
    <div className="category-analysis-row">
      <div className="category-analysis-top">
        <div className="category-analysis-name">
          <span className={`selector-cat-dot cat-${category.color || "lavender"}`} />
          <strong>{category.name}</strong>
          <span className="category-analysis-count">
            {category.totalTasks} {category.totalTasks === 1 ? "task" : "tasks"}
          </span>
          {hasSubs && (
            <button
              type="button"
              className="category-expand"
              onClick={() => setExpanded((previous) => !previous)}
              aria-label="Toggle subcategories"
            >
              <ChevronDown size={14} className={expanded ? "rotated" : ""} />
            </button>
          )}
        </div>

        <span className="category-analysis-percent">{category.completionRate}%</span>
      </div>

      <ProgressBar value={category.completionRate} className={`cat-bar cat-${category.color || "lavender"}`} />

      {expanded && hasSubs && (
        <div className="category-subs">
          {category.subcategories.map((sub) => (
            <div className="category-sub-row" key={sub._id}>
              <div className="category-analysis-name">
                <span className={`selector-cat-dot cat-${sub.color || "lavender"}`} />
                <span>{sub.name}</span>
                <span className="category-analysis-count">
                  {sub.completedTasks}/{sub.totalTasks}
                </span>
              </div>
              <span className="category-analysis-percent">{sub.completionRate}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;
