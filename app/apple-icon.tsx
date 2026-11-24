import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon: the same white tugrik sign on a full black square. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg width="128" height="128" viewBox="0 0 64 64">
          <path
            fill="#ffffff"
            d="M17 14H47V20H17Z M29 14H35V50H29Z M17 32L47 24V30L17 38Z M17 42L47 34V40L17 48Z"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
