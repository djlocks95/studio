
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { BookedSeatDetail } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Armchair, User, DollarSign, Edit, Trash2, MoreVertical } from 'lucide-react'; // Using Armchair as a generic seat icon

interface SeatSelectionProps {
  totalSeats: number;
  bookedSeatDetails: Map<number, BookedSeatDetail>; // Map of seat number to its booking details
  selectedSeats: number[]; // Seats selected for a new booking
  onSeatSelect: (seatNumber: number) => void; // For selecting available seats
  onBookedSeatAction: (action: 'edit' | 'unbook', bookingId: string, seatNumber: number) => void; // For actions on booked seats
  disabled?: boolean; // Overall disable for the component
}

export function SeatSelection({
  totalSeats,
  bookedSeatDetails,
  selectedSeats,
  onSeatSelect,
  onBookedSeatAction,
  disabled = false,
}: SeatSelectionProps) {
  const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "grid gap-2 p-4 border rounded-lg shadow-inner bg-card",
          "grid-cols-7 md:grid-cols-7 lg:grid-cols-7", 
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Seat Map"
        role="grid"
      >
        {seatNumbers.map((seatNumber) => {
          const bookingDetail = bookedSeatDetails.get(seatNumber);
          const isBooked = !!bookingDetail;
          const isSelectedForNewBooking = selectedSeats.includes(seatNumber);
          
          // A seat is disabled for new selection if it's globally disabled, already booked, or selected for new booking by another action.
          // Clicking a booked seat will trigger popover, not selection.
          const isSeatDisabledForSelection = disabled || isBooked;

          if (isBooked && bookingDetail) {
            // This is a booked seat
            return (
              <Popover key={`popover-${seatNumber}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'destructive'} // Visually distinct for booked seats
                        size="icon"
                        className={cn(
                          "h-10 w-10 md:h-9 md:w-9 text-xs font-semibold transition-all duration-150 ease-in-out",
                          "opacity-70 bg-destructive/70 hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
                        )}
                        aria-label={`Seat ${seatNumber} (Booked by ${bookingDetail.userName}). Click for options.`}
                        role="gridcell"
                      >
                        <Armchair className="h-5 w-5 text-destructive-foreground" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card text-card-foreground border shadow-lg rounded-md p-2">
                    <div className="flex flex-col items-start text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1.5 text-primary" />
                        <span>{bookingDetail.userName}</span>
                      </div>
                       <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1.5 text-green-500" />
                        <span>${bookingDetail.price.toFixed(2)}</span>
                      </div>
                       <p className="text-xs text-muted-foreground mt-1">Click for options</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto p-2 bg-card border shadow-xl rounded-lg">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBookedSeatAction('edit', bookingDetail.bookingId, seatNumber)}
                      className="w-full justify-start text-sm h-8"
                    >
                      <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit Price
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBookedSeatAction('unbook', bookingDetail.bookingId, seatNumber)}
                      className="w-full justify-start text-sm h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Unbook Seat
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          } else {
            // This is an available or selected-for-new-booking seat
            return (
              <Tooltip key={`tooltip-available-${seatNumber}`}>
                <TooltipTrigger asChild>
                    <Button
                        variant={isSelectedForNewBooking ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                        "h-10 w-10 md:h-9 md:w-9 text-xs font-semibold transition-all duration-150 ease-in-out transform hover:scale-105",
                        isSelectedForNewBooking && "ring-2 ring-offset-2 ring-primary shadow-lg scale-105",
                        !isBooked && !isSelectedForNewBooking && "hover:bg-primary/20"
                        )}
                        onClick={() => !isSeatDisabledForSelection && onSeatSelect(seatNumber)}
                        disabled={isSeatDisabledForSelection}
                        aria-label={`Seat ${seatNumber}${isSelectedForNewBooking ? ' (Selected for new booking)' : ' (Available)'}`}
                        aria-pressed={isSelectedForNewBooking}
                        role="gridcell"
                    >
                        <Armchair className={cn("h-5 w-5", isSelectedForNewBooking ? "text-primary-foreground" : "text-foreground" )} />
                    </Button>
                </TooltipTrigger>
                 <TooltipContent side="top" className="bg-card text-card-foreground border shadow-lg rounded-md p-2">
                    <p className="text-sm">
                    Seat {seatNumber}: {isSelectedForNewBooking ? 'Selected for new booking' : 'Available'}
                    </p>
                </TooltipContent>
              </Tooltip>
            );
          }
        })}
      </div>
    </TooltipProvider>
  );
}
