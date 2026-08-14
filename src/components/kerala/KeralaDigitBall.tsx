interface KeralaDigitBallProps {
  size?: string;
  digit: string | number;
  outline?: boolean;
  textClass?: string;
  className?: string;
}

export function KeralaDigitBall({
  size = "1.25rem",
  digit,
  outline = true,
  textClass = "",
  className = "",
}: KeralaDigitBallProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={
        "justify-center flex items-center rounded-full" +
        (outline ? " border border-main bg-white" : " bg-black") +
        (className ? " " + className : "")
      }
    >
      <p
        className={
          "font-bold text-sm " +
          (outline ? "text-black" : "text-white") +
          (textClass ? " " + textClass : "")
        }
      >
        {digit}
      </p>
    </div>
  );
}
