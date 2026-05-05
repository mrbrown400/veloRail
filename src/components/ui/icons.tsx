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
