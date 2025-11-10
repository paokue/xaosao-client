// export function Countdown({ timeLeft }: { timeLeft: number }) {
//   const minutes = Math.floor(timeLeft / 1000 / 60)
//     .toString()
//     .padStart(2, "0");
//   const seconds = Math.floor((timeLeft / 1000) % 60)
//     .toString()
//     .padStart(2, "0");

//   return (
//     <p className="text-sm text-gray-400">
//       Resend code in {minutes}:{seconds}
//     </p>
//   );
// }
import { useState, useEffect } from "react";

interface CountdownProps {
  initialMs: number; // e.g. 60000
}

export default function Countdown({ initialMs }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(initialMs);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1000 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span>
      You can resend code in: {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
