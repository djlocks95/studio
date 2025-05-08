
import type { DailyPrice } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';

const today = startOfDay(new Date());

export const MOCK_DAILY_PRICES: DailyPrice[] = [
  // No mock daily prices
];
