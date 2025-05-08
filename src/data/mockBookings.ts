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
  {
    id: 'booking1',
    date: addDays(today, 2),
    seats: [1, 2, 3, 10, 11],
    userName: 'Alice Wonderland',
    seatPrices: createSeatPrices([1, 2, 3, 10, 11], getPriceForDate(addDays(today, 2))),
  },
  {
    id: 'booking2',
    date: addDays(today, 5),
    seats: [5, 6, 7, 8, 9, 15, 16, 22, 23, 29, 30],
    userName: 'Bob The Builder',
    seatPrices: createSeatPrices([5, 6, 7, 8, 9, 15, 16, 22, 23, 29, 30], getPriceForDate(addDays(today, 5))),
  },
  {
    id: 'booking3',
    date: addDays(today, 2), 
    seats: [20, 21],
    userName: 'Charlie Chaplin',
    seatPrices: createSeatPrices([20, 21], getPriceForDate(addDays(today, 2))),
  },
  {
    id: 'booking4',
    date: addDays(today, 10),
    seats: Array.from({ length: 30 }, (_, i) => i + 1), // Almost fully booked
    userName: 'Fully Booked Inc.',
    seatPrices: createSeatPrices(Array.from({ length: 30 }, (_, i) => i + 1), getPriceForDate(addDays(today, 10))),
  },
  {
    id: 'booking5',
    date: addDays(today, 12),
    seats: [31,32,33,34,35], 
    userName: 'Eve Online',
    seatPrices: createSeatPrices([31,32,33,34,35], getPriceForDate(addDays(today, 12))),
  }
];
