interface TimeBoxProps {
  value: string | number
  label: string
}

const TimeBox = ({ value, label }: TimeBoxProps) => (
  <div className="flex flex-col items-center border border-white rounded-sm w-6">
    <div className="py-1 text-black bg-white rounded-b w-full text-center">
      {value}
    </div>
    <div className="din text-8">
      {label}
    </div>
  </div>
)

export interface TimeData {
  days: string | number
  hours: string | number
  minutes: string | number
  seconds: string | number
}

export const CountdownDisplay = ({ timeData }: { timeData: TimeData }) => (
  <div className="flex items-center text-xs font-bold text-white">
    {timeData.days !== '00' && (
      <>
        <TimeBox value={timeData.days} label="DAY" />
        <span className="mx-0.5">:</span>
      </>
    )}
    <TimeBox value={timeData.hours} label="HOU" />
    <span className="mx-0.5">:</span>
    <TimeBox value={timeData.minutes} label="MIN" />
    <span className="mx-0.5">:</span>
    <TimeBox value={timeData.seconds} label="SEC" />
  </div>
)
