import type { Route } from '@/types';

interface RouteOptionProps {
  route: Route;
  isSelected: boolean;
  onClick: () => void;
}

export function RouteOption({ route, isSelected, onClick }: RouteOptionProps) {
  const isFuture = route.isFuture;

  return (
    <div
      className={`route-option ${isSelected ? 'selected' : ''} ${isFuture ? 'future' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {isFuture && (
        <div className="future-route-badge">
          <span>{'\u{1F6A7}'}</span>
          <span>Future Route Preview</span>
        </div>
      )}

      <div className="route-option-content">
        <div className="route-option-header">
          <span className="route-option-label">{route.label}</span>
          <span className="route-option-duration" style={isFuture ? { color: '#f9ab00' } : undefined}>
            {route.formattedDuration}
          </span>
        </div>

        {isFuture && (
          <div className="route-option-summary" style={{ color: '#5d4037' }}>
            <span>Available {route.expectedOpening || 'TBD'}</span>
            {route.timeSavings && route.timeSavings > 0 && (
              <span style={{ marginLeft: '8px', color: '#188038' }}>
                Save ~{route.timeSavings} min
              </span>
            )}
          </div>
        )}

        {!isFuture && (
          <div className="route-option-summary">
            {route.summary}
          </div>
        )}
      </div>
    </div>
  );
}
