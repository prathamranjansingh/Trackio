import { useState, useEffect, useRef, useCallback } from "react";

export const useStopwatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // High-precision timer using requestAnimationFrame
  const updateTimer = useCallback(() => {
    if (isRunning) {
      const now = Date.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;
      setTime(elapsed);
      intervalRef.current = requestAnimationFrame(updateTimer);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current);
      }
    };
  }, [isRunning, updateTimer]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    pausedTimeRef.current = time;
    setIsRunning(false);
  }, [time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    pausedTimeRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
  };
};
