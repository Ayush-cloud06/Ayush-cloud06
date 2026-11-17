import { describe, expect, it, vi } from 'vitest';
import { dayKey, IDLE_MS, startOfWeek, StudyTimer } from './time';

describe('time', () => {
  it('dayKey is local YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
  });
  it('startOfWeek is Monday', () => {
    const wed = new Date(2026, 10, 18, 15).getTime();
    expect(new Date(startOfWeek(wed)).getDay()).toBe(1);
  });
  it('StudyTimer counts active seconds and pauses when idle', () => {
    vi.useFakeTimers();
    let t = 0;
    const flushed: number[] = [];
    const timer = new StudyTimer((_d, s) => flushed.push(s), () => t);
    timer.start();
    for (let i = 0; i < 30; i++) { t += 1000; timer.tick(); }
    t += IDLE_MS + 30_000; // idle
    timer.tick();
    for (let i = 0; i < 10; i++) { t += 1000; timer.tick(); } // still idle, not counted
    timer.ping();
    for (let i = 0; i < 5; i++) { t += 1000; timer.tick(); }
    timer.stop();
    expect(flushed.reduce((a, b) => a + b, 0)).toBe(35);
    vi.useRealTimers();
  });
});
