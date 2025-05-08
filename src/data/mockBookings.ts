import type { Booking } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';

const today = startOfDay(new Date());

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking1',
    date: addDays(today, 2),
    seats: [1, 2, 3, 10, 11],
    userName: 'Alice Wonderland',
  },
  {
    id: 'booking2',
    date: addDays(today, 5),
    seats: [5, 6, 7, 8, 9, 15, 16, 22, 23, 29, 30],
    userName: 'Bob The Builder',
  },
  {
    id: 'booking3',
    date: addDays(today, 2), 
    seats: [20, 21],
    userName: 'Charlie Chaplin',
  },
  {
    id: 'booking4',
    date: addDays(today, 10),
    seats: Array.from({ length: 30 }, (_, i) => i + 1), // Almost fully booked
    userName: 'Fully Booked Inc.',
  },
  {
    id: 'booking5',
    date: addDays(today, 12),
    seats: [31,32,33,34,35], 
    userName: 'Eve Online',
  }
];
