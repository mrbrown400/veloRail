import type { LocationStatus as LocationStatusType } from '@/types';

interface LocationStatusProps {
  status: LocationStatusType;
  onClick?: () => void;
}

export function LocationStatus({ status, onClick }: LocationStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '\u{23F3}'; // hourglass
      case 'granted':
        return '\u2713'; // checkmark
      case 'denied':
        return '\u26A0'; // warning
      case 'unavailable':
        return '\u2716'; // X
      default:
        return '\u{1F4CD}'; // pin
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Getting your location...';
      case 'granted':
        return 'Using your location';
      case 'denied':
        return 'Location access denied';
      case 'unavailable':
        return 'Location unavailable';
      default:
        return 'Unknown status';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'granted':
        return 'success';
      case 'denied':
      case 'unavailable':
        return 'warning';
      default:
        return '';
    }
  };

  return (
    <div
      className={`location-status ${getStatusClass()}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <span className="location-status-icon">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {(status === 'denied' || status === 'unavailable') && onClick && (
        <button
          type="button"
          style={{
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            color: '#1a73e8',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Enter start
        </button>
      )}
    </div>
  );
}
