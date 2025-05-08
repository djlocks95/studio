
'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Booking } from '@/lib/types';
import { startOfDay, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomCalendarProps {
  bookings: Booking[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  disabledDates?: (date: Date) => boolean;
  totalSeats: number;
}

export function CustomCalendar({
  bookings,
  selectedDate,
  onDateSelect,
  disabledDates,
  totalSeats,
}: CustomCalendarProps) {
  const dailyBookingCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach(booking => {
      const dateStr = startOfDay(booking.date).toISOString();
      counts.set(dateStr, (counts.get(dateStr) || 0) + booking.seats.length);
    });
    return counts;
  }, [bookings]);

  const modifiers = React.useMemo(() => {
    const bookedDatesWithData: Record<string, { bookedSeats: number; availableSeats: number }> = {};
    dailyBookingCounts.forEach((count, dateStr) => {
      bookedDatesWithData[dateStr] = {
        bookedSeats: count,
        availableSeats: totalSeats - count,
      };
    });

    return {
      booked: (date: Date) => dailyBookingCounts.has(startOfDay(date).toISOString()),
      fullyBooked: (date: Date) => (dailyBookingCounts.get(startOfDay(date).toISOString()) || 0) >= totalSeats,
      // Modifier for dates with some bookings but not fully booked
      partiallyBooked: (date: Date) => {
        const count = dailyBookingCounts.get(startOfDay(date).toISOString()) || 0;
        return count > 0 && count < totalSeats;
      },
    };
  }, [dailyBookingCounts, totalSeats]);

  const modifiersClassNames = {
    booked: 'day-with-bookings', // Generic marker for any booking
    fullyBooked: 'day-fully-booked', // Specific style for fully booked days
    partiallyBooked: 'day-partially-booked', // Specific style for partially booked days
  };

  const DayContent: React.FC<{ date: Date; displayMonth: Date }> = ({ date }) => {
    const dateStr = startOfDay(date).toISOString();
    const bookedCount = dailyBookingCounts.get(dateStr) || 0;
    const availableCount = totalSeats - bookedCount;
    const isFullyBooked = availableCount <= 0;

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{format(date, 'd')}</span>
        {dailyBookingCounts.has(dateStr) && !isFullyBooked && (
           <span className={cn(
            "absolute bottom-0.5 text-[0.6rem] font-medium leading-none",
            availableCount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {availableCount}
          </span>
        )}
        {isFullyBooked && (
            <span className="absolute bottom-0.5 text-[0.6rem] font-medium leading-none text-red-600 dark:text-red-400">
                Full
            </span>
        )}
      </div>
    );
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
      components={{
        DayContent: DayContent,
      }}
    />
  );
}

