import { useState, useEffect, useRef } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import type { VehiclePosition } from '@/types';

interface VehicleMarkerProps {
  position: VehiclePosition;
  color?: string;
  type?: 'train' | 'bus';
}

export function VehicleMarker({
  position,
  color = '#3b82f6',
  type = 'train'
}: VehicleMarkerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [animatedPosition, setAnimatedPosition] = useState({
    lat: position.latitude,
    lng: position.longitude
  });
  const animationRef = useRef<number | null>(null);
  const prevPositionRef = useRef({ lat: position.latitude, lng: position.longitude });

  // Animate to new position smoothly
  useEffect(() => {
    const targetLat = position.latitude;
    const targetLng = position.longitude;
    const startLat = prevPositionRef.current.lat;
    const startLng = prevPositionRef.current.lng;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const newLat = startLat + (targetLat - startLat) * eased;
      const newLng = startLng + (targetLng - startLng) * eased;

      setAnimatedPosition({ lat: newLat, lng: newLng });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevPositionRef.current = { lat: targetLat, lng: targetLng };
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position.latitude, position.longitude]);

  const statusText =
    position.currentStatus === 'STOPPED_AT' ? 'At station'
    : position.currentStatus === 'INCOMING_AT' ? 'Arriving'
    : 'In transit';

  return (
    <>
      <Marker
        position={animatedPosition}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }}
        onClick={() => setShowInfo(true)}
        zIndex={1000}
      />

      {showInfo && (
        <InfoWindow
          position={animatedPosition}
          onCloseClick={() => setShowInfo(false)}
        >
          <div style={{ textAlign: 'center', padding: '4px' }}>
            <strong>{type === 'train' ? 'Train' : 'Bus'} {position.label || position.vehicleId || ''}</strong>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {statusText}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
