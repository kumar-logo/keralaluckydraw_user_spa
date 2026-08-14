import { KeralaDigitBall } from "./KeralaDigitBall";
import { CloseCircleIcon } from "../../components/shared/CloseCircleIcon";

interface KeralaCodeBadgeProps {
  digit?: string;
  onDel?: () => void;
  isInsurance?: boolean;
}

export function KeralaCodeBadge({
  digit = "",
  onDel,
  isInsurance,
}: KeralaCodeBadgeProps) {
  return (
    <div className="relative">
      <div className="bg-light-gray dark:bg-charcoal rounded-xs flex py-2 px-1 gap-x-0.5">
        {digit.split("").map((char, index) => (
          <KeralaDigitBall
            key={index}
            digit={char}
            size="1.125rem"
            textClass="text-xs"
            outline={index !== 0}
          />
        ))}
      </div>
      {!isInsurance && (
        <div
          className="absolute -right-2 -top-2 cursor-pointer"
          onClick={onDel}
        >
          <CloseCircleIcon className="text-acc dark:text-selected" />
        </div>
      )}
    </div>
  );
}
