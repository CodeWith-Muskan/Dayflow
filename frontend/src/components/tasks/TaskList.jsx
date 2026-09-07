import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";

import CategoryTag from "../common/CategoryTag";

const TaskItem = ({ task, isReadOnly, onToggle, onEdit, onDelete, busy, confirmId, setConfirmId }) => {
  const showConfirm = confirmId === task._id;

  const handleDeleteClick = () => {
    if (showConfirm) {
      setConfirmId(null);
      onDelete(task);
    } else {
      setConfirmId(task._id);
    }
  };

  return (
    <div className={`df-task ${task.completed ? "is-completed" : ""}`}>
      <button
        type="button"
        className={`task-check ${task.completed ? "checked" : ""}`}
        onClick={() => onToggle(task)}
        disabled={isReadOnly || busy}
        aria-label={task.completed ? "Mark as not completed" : "Mark as completed"}
      >
        <Check size={15} strokeWidth={3} />
      </button>

      <div className="task-main">
        <p className="task-title">{task.title}</p>

        <div className="task-meta">
          {task.category && <CategoryTag category={task.category} />}
        </div>
      </div>

      {!isReadOnly && (
        <div className="task-actions">
          <button type="button" className="task-action" title="Edit task" onClick={() => onEdit(task)}>
            <Pencil size={15} />
          </button>

          <button
            type="button"
            className={`task-action danger ${showConfirm ? "confirming" : ""}`}
            title={showConfirm ? "Confirm delete" : "Delete task"}
            onClick={handleDeleteClick}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

const TaskList = ({
  tasks = [],
  isReadOnly = false,
  onToggle,
  onEdit,
  onDelete,
  busyId = null,
}) => {
  const [confirmId, setConfirmId] = useState(null);

  if (tasks.length === 0) return null;

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          isReadOnly={isReadOnly}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          busy={busyId === task._id}
          confirmId={confirmId}
          setConfirmId={setConfirmId}
        />
      ))}
    </div>
  );
};

export default TaskList;