'use client';

import type * as React from 'react';
import { Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Seat as SeatType } from '@/lib/types';

interface SeatProps {
  seatNumber: number;
  status: 'available' | 'booked' | 'selected';
  onSelect: (seatNumber: number) => void;
}

export function Seat({ seatNumber, status, onSelect }: SeatProps) {
  const handleClick = () => {
    if (status !== 'booked') {
      onSelect(seatNumber);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={status === 'booked'}
      className={cn(
        'w-12 h-12 md:w-14 md:h-14 transition-all duration-150 ease-in-out transform hover:scale-105',
        status === 'available' && 'bg-accent/20 border-accent hover:bg-accent/40 text-accent-foreground',
        status === 'selected' && 'bg-primary border-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
        status === 'booked' && 'bg-muted text-muted-foreground opacity-70 cursor-not-allowed'
      )}
      aria-label={`Seat ${seatNumber}, status: ${status}`}
    >
      <Armchair className="w-6 h-6 md:w-7 md:h-7" />
      <span className="sr-only">Seat {seatNumber}</span>
      <span className="absolute text-xs -top-1 -right-1 bg-background/80 px-1 rounded-full text-foreground">
        {seatNumber}
      </span>
    </Button>
  );
}
