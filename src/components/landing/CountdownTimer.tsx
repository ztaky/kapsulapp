import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  size?: "normal" | "large";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = ({ targetDate, size = "normal" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isLarge = size === "large";

  return (
    <div className={`flex items-center justify-center gap-2 ${isLarge ? "gap-4" : "gap-2"}`}>
      <TimeUnit value={timeLeft.days} label="jours" isLarge={isLarge} />
      <span className={`font-bold text-foreground/50 ${isLarge ? "text-3xl" : "text-xl"}`}>:</span>
      <TimeUnit value={timeLeft.hours} label="heures" isLarge={isLarge} />
      <span className={`font-bold text-foreground/50 ${isLarge ? "text-3xl" : "text-xl"}`}>:</span>
      <TimeUnit value={timeLeft.minutes} label="min" isLarge={isLarge} />
      <span className={`font-bold text-foreground/50 ${isLarge ? "text-3xl" : "text-xl"}`}>:</span>
      <TimeUnit value={timeLeft.seconds} label="sec" isLarge={isLarge} />
    </div>
  );
};

const TimeUnit = ({ value, label, isLarge }: { value: number; label: string; isLarge: boolean }) => (
  <div className="flex flex-col items-center">
    <div
      className={`bg-foreground/10 rounded-xl font-bold tabular-nums ${
        isLarge ? "text-4xl md:text-5xl px-4 py-3" : "text-2xl px-3 py-2"
      }`}
    >
      {value.toString().padStart(2, "0")}
    </div>
    <span className={`text-muted-foreground mt-1 ${isLarge ? "text-sm" : "text-xs"}`}>{label}</span>
  </div>
);

export default CountdownTimer;
