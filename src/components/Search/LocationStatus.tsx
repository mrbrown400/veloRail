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
    <button
      type="button"
      className={`location-status ${getStatusClass()}`}
      onClick={onClick}
      aria-label={getStatusText()}
    >
      <span className="location-status-icon" aria-hidden="true">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {(status === 'denied' || status === 'unavailable') && onClick && (
        <span className="location-status-action">
          Enter start
        </span>
      )}
    </button>
  );
}
