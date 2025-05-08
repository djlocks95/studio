'use client';

import type * as React from 'react';
import type { Seat as SeatType } from '@/lib/types';
import { Seat } from '@/components/seat';

interface SeatSelectionProps {
  totalSeats: number;
  bookedSeatsForDate: number[];
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
}

const SEATS_PER_ROW = 7;

export function SeatSelection({
  totalSeats,
  bookedSeatsForDate,
  selectedSeats,
  onSeatSelect,
}: SeatSelectionProps) {
  
  const getSeatStatus = (seatNumber: number): 'available' | 'booked' | 'selected' => {
    if (bookedSeatsForDate.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const rows: JSX.Element[][] = [];
  for (let i = 0; i < totalSeats; i += SEATS_PER_ROW) {
    const rowSeats: JSX.Element[] = [];
    for (let j = 0; j < SEATS_PER_ROW && i + j < totalSeats; j++) {
      const seatNumber = i + j + 1;
      rowSeats.push(
        <Seat
          key={seatNumber}
          seatNumber={seatNumber}
          status={getSeatStatus(seatNumber)}
          onSelect={onSeatSelect}
        />
      );
    }
    rows.push(rowSeats);
  }

  return (
    <div className="space-y-3 p-2 bg-card rounded-lg shadow-inner">
      <div className="p-2 text-center text-sm font-medium bg-muted rounded-md">FRONT OF BUS</div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-around gap-1 md:gap-2">
          {row}
        </div>
      ))}
       <div className="p-2 text-center text-sm font-medium bg-muted rounded-md">REAR OF BUS</div>
    </div>
  );
}
