const ProgressBar = ({ value = 0, className = "" }) => (
  <div className={`df-progress ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
    <div className="df-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export default ProgressBar;