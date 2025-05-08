'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Booking } from '@/lib/types';
import { startOfDay } from 'date-fns';

interface CustomCalendarProps {
  bookings: Booking[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  disabledDates?: (date: Date) => boolean;
}

export function CustomCalendar({
  bookings,
  selectedDate,
  onDateSelect,
  disabledDates,
}: CustomCalendarProps) {
  const bookedDates = React.useMemo(() => {
    const datesWithBookings = new Set<string>();
    bookings.forEach(booking => {
      datesWithBookings.add(startOfDay(booking.date).toISOString());
    });
    return Array.from(datesWithBookings).map(dateStr => new Date(dateStr));
  }, [bookings]);

  const modifiers = {
    booked: bookedDates,
  };

  const modifiersClassNames = {
    booked: 'day-with-bookings',
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      disabled={disabledDates}
      className="rounded-md border shadow"
    />
  );
}
