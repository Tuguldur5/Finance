type LogoMarkProps = {
  size: number;
  className?: string;
};

/** The brand mark: a white tugrik sign (₮) inside a black circle. */
export function LogoMark({ size, className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#0a0a0a"
        stroke="#404040"
        strokeWidth="1.5"
      />
      <path
        fill="#ffffff"
        d="M17 14H47V20H17Z M29 14H35V50H29Z M17 32L47 24V30L17 38Z M17 42L47 34V40L17 48Z"
      />
    </svg>
  );
}
