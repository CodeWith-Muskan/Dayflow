import { Clock, Lock, Moon, Pencil, Plus, Sun, Sunrise, Sunset, Trash2, TriangleAlert } from "lucide-react";

import { isPastKey } from "../../utils/dates";

const hourOf = (time) => {
  if (!time || typeof time !== "string") return 0;
  const [hour] = time.split(":").map(Number);
  return Number.isFinite(hour) ? hour : 0;
};

// Time-of-day sections used to group a daily plan.
const SECTIONS = [
  { key: "morning", label: "Morning", icon: Sunrise, min: 6, max: 11 },
  { key: "afternoon", label: "Afternoon", icon: Sun, min: 12, max: 17 },
  { key: "evening", label: "Evening", icon: Sunset, min: 18, max: 21 },
  { key: "night", label: "Night", icon: Moon, min: 22, max: 5 },
];

const sectionOf = (item) =>
  SECTIONS.find((section) => {
    const hour = hourOf(item.startTime);
    if (section.key === "night") return hour >= 22 || hour <= 5;
    return hour >= section.min && hour <= section.max;
  }) || SECTIONS[3];

// Vertical day timeline grouped into Morning / Afternoon / Evening / Night.
// Past days render read-only. Recurring items show a small "repeats" badge.
const DailyTimeline = ({
  date,
  items = [],
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  error = "",
  onRetry,
}) => {
  const readOnly = isPastKey(date);

  const groups = SECTIONS.map((section) => ({
    section,
    items: items
      .filter((item) => sectionOf(item).key === section.key)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
  })).filter((group) => group.items.length > 0);

  const hasAny = groups.length > 0;

  return (
    <div className="daily-timeline">
      {!readOnly && onAdd && (
        <button type="button" className="df-btn primary add-schedule" onClick={onAdd}>
          <Plus size={16} />
          Add time block
        </button>
      )}

      {readOnly && (
        <span className="lock-chip inline">
          <Lock size={12} />
          Past days are read-only
        </span>
      )}

      {error ? (
        <div className="error-state">
          <TriangleAlert size={20} />
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="df-btn secondary" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="day-panel-loading">
          <div className="loading-spinner small" />
        </div>
      ) : !hasAny ? (
        <div className="day-panel-empty">
          <Clock size={22} />
          <p>
            {readOnly
              ? "Nothing was scheduled on this day."
              : "No time blocks yet. Add one to map out your day."}
          </p>
        </div>
      ) : (
        <div className="timeline">
          {groups.map(({ section, items: sectionItems }) => {
            const Icon = section.icon;
            return (
              <div className="timeline-section" key={section.key}>
                <div className="timeline-section-label">
                  <Icon size={14} />
                  <span>{section.label}</span>
                  <em>{sectionItems.length}</em>
                </div>

                {sectionItems.map((item) => (
                  <div className="timeline-item" key={item._id}>
                    <div className="timeline-time">
                      <strong>{item.startTime}</strong>
                      {item.endTime && <span>{item.endTime}</span>}
                    </div>

                    <div className="timeline-line" />

                    <div className="timeline-body">
                      <div className="timeline-title-row">
                        <strong className="timeline-title">{item.title}</strong>

                        {item.recurrence?.type && item.recurrence.type !== "none" && (
                          <span className="repeat-chip">repeats</span>
                        )}

                        {!readOnly && (
                          <span className="timeline-actions">
                            <button
                              type="button"
                              className="task-action"
                              title="Edit time block"
                              onClick={() => onEdit?.(item)}
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              className="task-action danger"
                              title="Delete time block"
                              onClick={() => onDelete?.(item)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </span>
                        )}
                      </div>

                      {item.category?.name && (
                        <span className={`category-tag cat-${item.category.color || "lavender"}`}>
                          <span className="category-tag-dot" />
                          {item.category.name}
                        </span>
                      )}

                      {item.description && (
                        <p className="timeline-desc">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DailyTimeline;