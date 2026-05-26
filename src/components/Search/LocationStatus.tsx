import {
  AlertIcon,
  CheckIcon,
  CrosshairIcon,
  MapPinIcon,
  UnavailableIcon
} from '@/components/ui';
import type { LocationStatus as LocationStatusType } from '@/types';

interface LocationStatusProps {
  status: LocationStatusType;
  onClick?: () => void;
}

export function LocationStatus({ status, onClick }: LocationStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <CrosshairIcon />;
      case 'granted':
        return <CheckIcon />;
      case 'denied':
      case 'timeout':
        return <AlertIcon />;
      case 'unavailable':
        return <UnavailableIcon />;
      default:
        return <MapPinIcon />;
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
      case 'timeout':
        return 'Location request timed out';
      case 'unavailable':
        return 'Location unavailable';
      default:
        return 'Use current location';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'granted':
        return 'success';
      case 'denied':
      case 'timeout':
      case 'unavailable':
        return 'warning';
      default:
        return '';
    }
  };

  return (
    <button
      type="button"
      className={`location-status ${getStatusClass()}`}
      onClick={onClick}
      aria-label={getStatusText()}
    >
      <span className="location-status-icon" aria-hidden="true">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      <span
        className="sr-only"
        role={status === 'denied' || status === 'timeout' || status === 'unavailable' ? 'alert' : 'status'}
        aria-live={status === 'denied' || status === 'timeout' || status === 'unavailable' ? 'assertive' : 'polite'}
      >
        {getStatusText()}
      </span>
      {(status === 'idle' || status === 'denied' || status === 'timeout' || status === 'unavailable') && onClick && (
        <span className="location-status-action">
          {status === 'idle' ? 'Set start' : 'Enter start'}
        </span>
      )}
    </button>
  );
}
