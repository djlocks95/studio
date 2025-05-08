'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { CustomCalendar } from '@/components/custom-calendar';
import { SeatSelection } from '@/components/seat-selection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { MOCK_BOOKINGS } from '@/data/mockBookings';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle } from 'lucide-react';

const TOTAL_SEATS = 35;

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const { toast } = useToast();

  // Load mock bookings on mount
  useEffect(() => {
    // Simulate fetching bookings
    setCurrentBookings(MOCK_BOOKINGS);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSeats([]); // Reset selected seats when date changes
  };

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats(prevSelectedSeats =>
      prevSelectedSeats.includes(seatNumber)
        ? prevSelectedSeats.filter(s => s !== seatNumber)
        : [...prevSelectedSeats, seatNumber]
    );
  };

  const handleBooking = () => {
    if (!selectedDate || selectedSeats.length === 0) {
      toast({
        title: 'Booking Incomplete',
        description: 'Please select a date and at least one seat.',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }

    // Create a new booking object
    const newBooking: Booking = {
      id: `booking-${Date.now()}`, // Simple ID generation
      date: selectedDate,
      seats: selectedSeats,
      userName: 'CurrentUser', // In a real app, this would come from auth
    };

    // Add new booking to the list (simulating DB update)
    setCurrentBookings(prevBookings => [...prevBookings, newBooking]);
    
    toast({
      title: 'Booking Confirmed!',
      description: `You've booked ${selectedSeats.length} seat(s) for ${format(selectedDate, 'PPP')}.`,
      action: <CheckCircle2 className="text-green-500" />,
    });

    setSelectedSeats([]); // Reset selection after booking
  };

  const bookedSeatsForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    const startOfSelected = startOfDay(selectedDate);
    return currentBookings
      .filter(booking => startOfDay(booking.date).getTime() === startOfSelected.getTime())
      .flatMap(booking => booking.seats);
  }, [selectedDate, currentBookings]);

  const availableSeatsCount = TOTAL_SEATS - bookedSeatsForSelectedDate.length;

  const disablePastDates = (date: Date) => isBefore(date, startOfDay(new Date()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-2">
          <Ticket className="w-12 h-12 text-primary mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Kcrown Tickets
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your Premier Party Bus Booking Experience!
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CalendarDays className="mr-2 text-primary" />
              Select Your Date
            </CardTitle>
            <CardDescription>
              Choose a date for your party bus adventure. Dates with available seats are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CustomCalendar
              bookings={currentBookings}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              disabledDates={disablePastDates}
            />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              Book Your Seats
            </CardTitle>
            <CardDescription>
              {selectedDate
                ? `Select seats for ${format(selectedDate, 'PPP')}. Available: ${availableSeatsCount}/${TOTAL_SEATS}`
                : 'Please select a date to see available seats.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              availableSeatsCount > 0 ? (
                <SeatSelection
                  totalSeats={TOTAL_SEATS}
                  bookedSeatsForDate={bookedSeatsForSelectedDate}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                />
              ) : (
                <div className="text-center py-10 text-lg font-semibold text-destructive-foreground bg-destructive/80 rounded-md">
                  Sorry, no seats available for this date.
                </div>
              )
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays size={48} className="mx-auto mb-2" />
                Pick a date from the calendar.
              </div>
            )}
          </CardContent>
          {selectedDate && availableSeatsCount > 0 && (
            <CardFooter className="flex flex-col items-stretch gap-3 pt-4">
               {selectedSeats.length > 0 && (
                <div className="text-sm text-center text-primary font-medium">
                  Selected Seats: {selectedSeats.join(', ')} ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''})
                </div>
              )}
              <Button
                onClick={handleBooking}
                disabled={selectedSeats.length === 0}
                size="lg"
                className="w-full text-lg font-semibold"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Book Now ({selectedSeats.length})
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kcrown Tickets. All rights reserved.</p>
        <p>Powered by Good Times & Great Music.</p>
      </footer>
    </div>
  );
}
