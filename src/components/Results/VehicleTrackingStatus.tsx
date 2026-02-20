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
        <span className="tracking-icon">{'\u{1F4CD}'}</span>
        <span className="tracking-label">Live Tracking</span>
      </div>
      <div className="vehicle-tracking-info">
        <strong>{lineInfo}</strong>
        <span style={{ marginLeft: '8px', color: '#5f6368' }}>
          {statusText}
        </span>
        {stopsAwayContent}
      </div>
    </div>
  );
}
