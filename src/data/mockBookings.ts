
import type { Booking } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';
import { MOCK_DAILY_PRICES } from './mockDailyPrices';

const today = startOfDay(new Date());
const DEFAULT_SEAT_PRICE = 25;

const getPriceForDate = (date: Date): number => {
  const specificPriceEntry = MOCK_DAILY_PRICES.find(
    dp => startOfDay(dp.date).getTime() === startOfDay(date).getTime()
  );
  return specificPriceEntry ? specificPriceEntry.price : DEFAULT_SEAT_PRICE;
};

const createSeatPrices = (seats: number[], price: number): { [seatNumber: number]: number } => {
  return seats.reduce((acc, seatNum) => {
    acc[seatNum] = price;
    return acc;
  }, {} as { [seatNumber: number]: number });
};

export const MOCK_BOOKINGS: Booking[] = [
  // No mock bookings
];
