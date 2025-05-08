
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Armchair } from 'lucide-react'; // Using Armchair as a generic seat icon

interface SeatSelectionProps {
  totalSeats: number;
  bookedSeats: number[];
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  disabled?: boolean; // Overall disable for the component
}

export function SeatSelection({
  totalSeats,
  bookedSeats,
  selectedSeats,
  onSeatSelect,
  disabled = false,
}: SeatSelectionProps) {
  const seatsPerRow = 7; // Example: 5 rows of 7 seats = 35 seats
  const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "grid gap-2 p-4 border rounded-lg shadow-inner bg-card",
        // Adjust grid columns based on seatsPerRow or make it responsive
        "grid-cols-7 md:grid-cols-7 lg:grid-cols-7", 
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label="Seat Map"
      role="grid"
    >
      {seatNumbers.map((seatNumber) => {
        const isBooked = bookedSeats.includes(seatNumber);
        const isSelected = selectedSeats.includes(seatNumber);
        const isSeatDisabled = disabled || isBooked;

        return (
          <Button
            key={seatNumber}
            variant={isSelected ? 'default' : isBooked ? 'destructive' : 'outline'}
            size="icon"
            className={cn(
              "h-10 w-10 md:h-9 md:w-9 text-xs font-semibold transition-all duration-150 ease-in-out transform hover:scale-105",
              isSelected && "ring-2 ring-offset-2 ring-primary shadow-lg scale-105",
              isBooked && "opacity-70 cursor-not-allowed bg-destructive/70 hover:bg-destructive/70 text-destructive-foreground",
              !isBooked && !isSelected && "hover:bg-accent/50"
            )}
            onClick={() => !isSeatDisabled && onSeatSelect(seatNumber)}
            disabled={isSeatDisabled}
            aria-label={`Seat ${seatNumber}${isBooked ? ' (Booked)' : isSelected ? ' (Selected)' : ' (Available)'}`}
            aria-pressed={isSelected}
            role="gridcell"
          >
            <Armchair className={cn("h-5 w-5", isSelected ? "text-primary-foreground" : isBooked ? "text-destructive-foreground" : "text-foreground" )} />
            {/* <span className="sr-only">{seatNumber}</span> */}
          </Button>
        );
      })}
    </div>
  );
}
