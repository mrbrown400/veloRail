import { Chip, MapPinIcon, TrainIcon } from '@/components/ui';
import { useRealtimeStore } from '@/stores';
import type { Route } from '@/types';

interface VehicleTrackingStatusProps {
  route: Route;
}

export function VehicleTrackingStatus({ route }: VehicleTrackingStatusProps) {
  const { vehiclePosition, trackedVehicle } = useRealtimeStore();

  // Find the first transit leg
  const transitLeg = route.legs.find(leg => leg.mode === 'transit');

  if (!transitLeg || !trackedVehicle || !vehiclePosition) {
    return null;
  }

  const statusText =
    vehiclePosition.currentStatus === 'STOPPED_AT' ? 'at station'
    : vehiclePosition.currentStatus === 'INCOMING_AT' ? 'arriving at station'
    : 'in transit';

  const lineInfo = transitLeg.line ? `${transitLeg.line} Line` : 'Your train';

  // Calculate stops away if we have stop sequence info
  let stopsAwayContent = null;
  if (vehiclePosition.currentStopSequence && transitLeg.boardingStopSequence) {
    const stopsAway = transitLeg.boardingStopSequence - vehiclePosition.currentStopSequence;
    if (stopsAway > 0) {
      stopsAwayContent = (
        <span className="stops-away">
          {stopsAway} stop{stopsAway !== 1 ? 's' : ''} away
        </span>
      );
    } else if (stopsAway === 0) {
      stopsAwayContent = (
        <span className="stops-away arriving">
          Arriving at your stop!
        </span>
      );
    }
  }

  return (
    <div className="vehicle-tracking-status">
      <div className="vehicle-tracking-header">
        <MapPinIcon className="tracking-icon" />
        <span className="tracking-label">Live Tracking</span>
        <Chip tone="success" className="tracking-live-badge">Live</Chip>
      </div>
      <div className="vehicle-tracking-info">
        <TrainIcon className="tracking-line-icon" />
        <strong>{lineInfo}</strong>
        <span className="tracking-status-text">{statusText}</span>
        {stopsAwayContent}
      </div>
    </div>
  );
}
