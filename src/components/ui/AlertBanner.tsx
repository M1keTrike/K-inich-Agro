import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

interface AlertBannerProps {
  crisisId: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning';
  onDismiss?: () => void;
}

const severityStyles = {
  critical: {
    container: 'bg-red-50 border-l-4 border-red-500 text-red-800',
    icon: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />,
  },
  warning: {
    container: 'bg-orange-50 border-l-4 border-orange-400 text-orange-800',
    icon: <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" aria-hidden="true" />,
  },
};

export function AlertBanner({ crisisId, title, description, severity, onDismiss }: AlertBannerProps) {
  const styles = severityStyles[severity];

  return (
    <div
      key={crisisId}
      className={`flex items-start gap-3 px-4 py-3 rounded-md ${styles.container}`}
      role="alert"
    >
      {styles.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p
          className="text-sm truncate"
          title={description}
        >
          {description}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
