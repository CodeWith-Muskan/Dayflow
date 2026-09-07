import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children, footer, size }) => {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`df-modal ${size ? `modal-${size}` : ""}`} role="dialog" aria-modal="true">
        <div className="df-modal-header">
          <h3>{title}</h3>

          <button type="button" className="df-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="df-modal-body">{children}</div>

        {footer && <div className="df-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;