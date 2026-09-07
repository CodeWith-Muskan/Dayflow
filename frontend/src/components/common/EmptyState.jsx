const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="empty-state">
    <div className="empty-art">
      <span className="empty-orb empty-orb-a" />
      <span className="empty-orb empty-orb-b" />
      {Icon && <Icon size={22} />}
    </div>

    <p className="empty-title">{title}</p>

    {subtitle && <p className="empty-subtitle">{subtitle}</p>}

    {action && <div className="empty-actions">{action}</div>}
  </div>
);

export default EmptyState;