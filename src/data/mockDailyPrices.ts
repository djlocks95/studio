
import type { DailyPrice } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';

const today = startOfDay(new Date());

export const MOCK_DAILY_PRICES: DailyPrice[] = [
  {
    date: addDays(today, 2),
    price: 30, // Higher price for a specific date
  },
  {
    date: addDays(today, 5),
    price: 20, // Lower price
  },
  {
    date: addDays(today, 10), // Date that is almost fully booked
    price: 35,
  }
];
