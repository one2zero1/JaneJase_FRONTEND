interface Metric {
  label: string;
  value: string;
  limit?: string;
  description?: string;
  status: 'Good' | 'Normal' | 'Warning';
  icon: string;
}

interface MetricsCardProps {
  metrics: Metric[];
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-surface dark:bg-surface-dark p-5 rounded-xl border border-border flex flex-col justify-between hover:shadow-soft transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2 text-text-muted">
              <span className="material-symbols-outlined text-lg">
                {metric.icon}
              </span>
              <span className="text-xs font-semibold uppercase">
                {metric.label}
              </span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                metric.status === 'Good'
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {metric.status}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-text">{metric.value}</span>
            <span className="text-xs text-text-muted">
              {metric.limit || metric.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
