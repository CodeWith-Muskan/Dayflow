import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { isPastKey } from "../../utils/dates";

const HOUR_HEIGHT = 48;
const SNAP_MINUTES = 15;
const TOTAL_HOURS = 24;
const LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  const h = i % 24;
  const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
  return { hour: h, label };
});

const timeToMinutes = (time) => {
  if (!time || typeof time !== "string") return 0;
  const [h, m] = time.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const minutesToTime = (totalMinutes) => {
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const snapToGrid = (minutes) => Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

const minutesToY = (minutes) => (minutes / 60) * HOUR_HEIGHT;
const yToMinutes = (y) => Math.max(0, Math.min(1439, (y / HOUR_HEIGHT) * 60));

const InteractiveTimeline = ({
  date,
  items = [],
  readOnly = false,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isPastKey(date)) {
      containerRef.current.scrollTop = 0;
    } else {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const scrollTo = Math.max(0, minutesToY(currentMinutes) - 100);
      containerRef.current.scrollTop = scrollTo;
    }
  }, [date]);

  const getMinutesFromEvent = useCallback((event) => {
    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top + containerRef.current.scrollTop;
    return snapToGrid(yToMinutes(y));
  }, []);

  const handleMouseDown = useCallback(
    (event) => {
      if (readOnly) return;
      if (event.target.closest(".timeline-block-bar")) return;

      const minutes = getMinutesFromEvent(event);
      setDragging(true);
      setDragStart(minutes);
      setDragEnd(minutes);
    },
    [readOnly, getMinutesFromEvent]
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (!dragging) return;
      const minutes = getMinutesFromEvent(event);
      setDragEnd(minutes);
    },
    [dragging, getMinutesFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;

    const startMin = Math.min(dragStart, dragEnd);
    const endMin = Math.max(dragStart, dragEnd);

    setDragging(false);
    setDragStart(null);
    setDragEnd(null);

    if (endMin - startMin < SNAP_MINUTES) {
      const blockEnd = Math.min(startMin + 60, 1439);
      onCreate?.(minutesToTime(startMin), minutesToTime(blockEnd));
    } else {
      onCreate?.(minutesToTime(startMin), minutesToTime(endMin));
    }
  }, [dragging, dragStart, dragEnd, onCreate]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e) => handleMouseMove(e);
    const onMouseUp = () => handleMouseUp();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const selectionTop = dragging
    ? minutesToY(Math.min(dragStart, dragEnd))
    : 0;
  const selectionHeight = dragging
    ? Math.abs(minutesToY(dragEnd) - minutesToY(dragStart))
    : 0;

  const hourColor = (hour) => (hour >= 22 || hour < 6) ? "var(--text-faint)" : "var(--accent)";

  return (
    <div
      className={`interactive-timeline ${readOnly ? "read-only" : ""}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      <div
        className="interactive-timeline-inner"
        style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
      >
        {LABELS.map(({ hour, label }) => (
          <div
            className="interactive-timeline-hour"
            key={hour}
            style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          >
            <span
              className="interactive-timeline-hour-label"
              style={{ color: hourColor(hour) }}
            >
              {label}
            </span>
            <div className="interactive-timeline-hour-line" />
          </div>
        ))}

        {items.map((item) => {
          const startMin = timeToMinutes(item.startTime);
          const endMin = item.endTime ? timeToMinutes(item.endTime) : startMin + 60;
          const top = minutesToY(startMin);
          const height = Math.max(minutesToY(endMin - startMin), 20);

          return (
            <div
              className="timeline-block-bar"
              key={item._id}
              style={{ top, height }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="timeline-block-bar-inner">
                <div className="timeline-block-bar-head">
                  <span className="timeline-block-bar-time">
                    {item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}
                  </span>

                  {!readOnly && (
                    <span className="timeline-block-bar-actions">
                      <button
                        type="button"
                        className="task-action"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(item);
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="task-action danger"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(item);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  )}
                </div>

                <strong className="timeline-block-bar-title">{item.title}</strong>

                {item.category?.name && (
                  <span className={`category-tag cat-${item.category.color || "lavender"}`}>
                    <span className="category-tag-dot" />
                    {item.category.name}
                  </span>
                )}

                {item.recurrence?.type && item.recurrence.type !== "none" && (
                  <span className="repeat-chip">repeats</span>
                )}
              </div>
            </div>
          );
        })}

        {dragging && (
          <div
            className="interactive-timeline-selection"
            style={{ top: selectionTop, height: selectionHeight }}
          >
            <span className="interactive-timeline-selection-label">
              {minutesToTime(Math.min(dragStart, dragEnd))} –{" "}
              {minutesToTime(Math.max(dragStart, dragEnd))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveTimeline;
