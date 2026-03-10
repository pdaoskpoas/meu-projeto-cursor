import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface BoostCountdownProps {
  endTime: string;
  onExpire: () => void;
}

const BoostCountdown: React.FC<BoostCountdownProps> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center space-x-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
      <Zap className="h-4 w-4 text-purple-600" />
      <div className="flex items-center space-x-1 font-mono text-sm">
        <span className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-bold">
          {formatTime(timeLeft.hours)}
        </span>
        <span className="text-purple-600">:</span>
        <span className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-bold">
          {formatTime(timeLeft.minutes)}
        </span>
        <span className="text-purple-600">:</span>
        <span className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-bold">
          {formatTime(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};

export default BoostCountdown;
