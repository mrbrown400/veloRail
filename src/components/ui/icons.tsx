import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function iconProps(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: false,
    'aria-hidden': true,
    ...props
  };
}

export function BikeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M8.5 17.5 11 10h3l2.5 7.5" />
      <path d="M11 10 8.5 7.5H7" />
      <path d="M14 10 16 7h2" />
    </svg>
  );
}

export function WalkIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M10.5 8.5 8 13l-1.5 6" />
      <path d="M12 9l3 3 2 7" />
      <path d="M9 13h5" />
      <path d="M11 19h-3" />
    </svg>
  );
}

export function BusIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5" y="4" width="14" height="14" rx="3" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <circle cx="8.5" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="16" r="1" fill="currentColor" stroke="none" />
      <path d="M8 20v-2" />
      <path d="M16 20v-2" />
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 16h12" />
      <path d="M7.5 16 9 10h6l1.5 6" />
      <path d="M8 10 9.5 7h5L16 10" />
      <circle cx="8" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrainIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M8 8h8" />
      <path d="M8 13h8" />
      <path d="M8.5 21 10.5 18" />
      <path d="M15.5 18 17.5 21" />
    </svg>
  );
}

export function TransitIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="4" y="3" width="16" height="15" rx="3" />
      <path d="M8 8h8" />
      <path d="M8 13h8" />
      <circle cx="8.5" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="16" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 21 10.5 18" />
      <path d="M15.5 18 17.5 21" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

export function LegendIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
      <circle cx="3" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FutureRailIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 17c4-7 8-10 16-10" />
      <path d="M16 5h4v4" />
      <circle cx="6" cy="15" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VisionIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />
    </svg>
  );
}

export function FreightRailIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 18h16" />
      <path d="M6 14h12" />
      <path d="M8 10h8" />
      <path d="M7 18 12 6l5 12" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 6 18 18" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export function CrosshairIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function OriginIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DestinationIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 21V5" />
      <path d="M6 5h10l-2 4 2 4H6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function UnavailableIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

export function VeloRailMark() {
  return (
    <span className="velorail-mark" aria-hidden="true">
      <BikeIcon className="velorail-mark__icon" />
      <span className="velorail-mark__connector" />
      <TrainIcon className="velorail-mark__icon" />
    </span>
  );
}
