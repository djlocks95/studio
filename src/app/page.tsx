
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CustomCalendar } from '@/components/custom-calendar';
// SeatSelection component is removed as per new booking flow
// import { SeatSelection } from '@/components/seat-selection'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Booking, DailyPrice } from '@/lib/types';
import { MOCK_BOOKINGS } from '@/data/mockBookings';
import { MOCK_DAILY_PRICES } from '@/data/mockDailyPrices';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle, DollarSign, User, BarChart3, MinusCircle, PlusCircle, BoxSelect } from 'lucide-react';

const TOTAL_SEATS = 35;
const DEFAULT_SEAT_PRICE = 25;

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentBookings, setCurrentBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>(MOCK_DAILY_PRICES);
  // selectedSeats state is removed as per new booking flow
  // const [selectedSeats, setSelectedSeats] = useState<number[]>([]); 
  const [userName, setUserName] = useState<string>('');
  const [bookingQuantity, setBookingQuantity] = useState<string>('1');
  const [currentPriceInput, setCurrentPriceInput] = useState<string>(String(DEFAULT_SEAT_PRICE.toFixed(2)));
  const { toast } = useToast();

  const getSeatPriceForDate = useCallback((date: Date): number => {
    const specificPriceEntry = dailyPrices.find(
      dp => startOfDay(dp.date).getTime() === startOfDay(date).getTime()
    );
    return specificPriceEntry ? specificPriceEntry.price : DEFAULT_SEAT_PRICE;
  }, [dailyPrices]);

  useEffect(() => {
    if (selectedDate) {
      const priceForDate = getSeatPriceForDate(selectedDate);
      setCurrentPriceInput(String(priceForDate.toFixed(2)));
    } else {
      setCurrentPriceInput(String(DEFAULT_SEAT_PRICE.toFixed(2)));
    }
  }, [selectedDate, getSeatPriceForDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // setSelectedSeats([]); // No longer needed
    setBookingQuantity('1'); // Reset quantity on new date selection
  };

  // handleSeatSelect is removed as per new booking flow
  // const handleSeatSelect = (seatNumber: number) => { ... };

  const handleSetPriceForSelectedDate = () => {
    if (!selectedDate) return;
    const newPrice = parseFloat(currentPriceInput);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid positive number for the price.',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      setCurrentPriceInput(String(getSeatPriceForDate(selectedDate).toFixed(2)));
      return;
    }

    setDailyPrices(prevPrices => {
      const existingPriceIndex = prevPrices.findIndex(
        dp => startOfDay(dp.date).getTime() === startOfDay(selectedDate).getTime()
      );
      if (existingPriceIndex > -1) {
        const updatedPrices = [...prevPrices];
        updatedPrices[existingPriceIndex] = { ...updatedPrices[existingPriceIndex], price: newPrice };
        return updatedPrices;
      } else {
        return [...prevPrices, { date: selectedDate, price: newPrice }];
      }
    });
    toast({
      title: 'Price Updated',
      description: `Price for ${format(selectedDate, 'PPP')} set to $${newPrice.toFixed(2)}.`,
      action: <CheckCircle2 className="text-green-500" />
    });
  };
  
  const seatPriceForSelectedDate = useMemo(() => {
    return selectedDate ? getSeatPriceForDate(selectedDate) : DEFAULT_SEAT_PRICE;
  }, [selectedDate, getSeatPriceForDate]);

  const bookedSeatsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const startOfSelected = startOfDay(selectedDate);
    return currentBookings
      .filter(booking => startOfDay(booking.date).getTime() === startOfSelected.getTime())
      .flatMap(booking => booking.seats);
  }, [selectedDate, currentBookings]);

  const availableSeatsCount = TOTAL_SEATS - bookedSeatsForSelectedDate.length;

  const handleBooking = () => {
    const quantity = parseInt(bookingQuantity, 10);

    if (!selectedDate || quantity <= 0) {
      toast({
        title: 'Booking Incomplete',
        description: 'Please select a date and enter a valid quantity of seats.',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }
    if (!userName.trim()) {
      toast({
        title: 'User Name Required',
        description: 'Please enter a name for the booking.',
        variant: 'destructive',
        action: <User className="text-destructive-foreground" />,
      });
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid number of seats to book.',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }

    const allSeatNumbers = Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1);
    const currentlyAvailableSeatNumbers = allSeatNumbers.filter(
      seatNum => !bookedSeatsForSelectedDate.includes(seatNum)
    );

    if (quantity > currentlyAvailableSeatNumbers.length) {
      toast({
        title: 'Not Enough Seats',
        description: `Only ${currentlyAvailableSeatNumbers.length} seat(s) available, but ${quantity} were requested.`,
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }

    const seatsToBook = currentlyAvailableSeatNumbers.slice(0, quantity);

    const bookingSeatPrices = seatsToBook.reduce((acc, seatNum) => {
      acc[seatNum] = seatPriceForSelectedDate;
      return acc;
    }, {} as { [seatNumber: number]: number });

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      date: selectedDate,
      seats: seatsToBook,
      userName: userName.trim(),
      seatPrices: bookingSeatPrices,
    };

    setCurrentBookings(prevBookings => [...prevBookings, newBooking]);
    
    const totalCost = quantity * seatPriceForSelectedDate;
    toast({
      title: 'Booking Confirmed!',
      description: `${userName.trim()} booked ${quantity} seat(s) for ${format(selectedDate, 'PPP')}. Total cost: $${totalCost.toFixed(2)}. Seats: ${seatsToBook.join(', ')}.`,
      action: <CheckCircle2 className="text-green-500" />,
    });

    // setSelectedSeats([]); // No longer needed
    setUserName(''); 
    setBookingQuantity('1'); 
  };

  const profitForSelectedDate = useMemo(() => {
    if (!selectedDate) return 0;
    const startOfSelected = startOfDay(selectedDate);
    return currentBookings
      .filter(booking => startOfDay(booking.date).getTime() === startOfSelected.getTime())
      .reduce((totalProfit, booking) => {
        if (booking.seatPrices) {
          return totalProfit + Object.values(booking.seatPrices).reduce((sum, price) => sum + price, 0);
        }
        return totalProfit + (booking.seats.length * getSeatPriceForDate(booking.date));
      }, 0);
  }, [selectedDate, currentBookings, getSeatPriceForDate]);

  const disablePastDates = (date: Date) => isBefore(date, startOfDay(new Date()));

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || (numValue > 0 && numValue <= availableSeatsCount)) {
      setBookingQuantity(value);
    } else if (numValue > availableSeatsCount) {
      setBookingQuantity(String(availableSeatsCount));
    } else if (numValue <= 0 && value !== '') {
       setBookingQuantity('1');
    }
  };

  const incrementQuantity = () => {
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity < availableSeatsCount) {
      setBookingQuantity(String(currentQuantity + 1));
    }
  };

  const decrementQuantity = () => {
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity > 1) {
      setBookingQuantity(String(currentQuantity - 1));
    }
  };

  const currentBookingQuantity = parseInt(bookingQuantity, 10) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Ticket className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Kcrown Tickets
            </h1>
          </div>
          <Link href="/profits" passHref>
            <Button variant="outline" className="shadow-md">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Profits
            </Button>
          </Link>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          Your Premier Party Bus Booking Experience! (Admin Panel)
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
              Choose a date for booking. Dates with available seats are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CustomCalendar
              bookings={currentBookings}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              disabledDates={disablePastDates}
              totalSeats={TOTAL_SEATS}
            />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <BoxSelect className="mr-2 text-primary h-7 w-7" /> Book Seats
            </CardTitle>
            {selectedDate ? (
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-input" className="text-base font-medium">
                    Price for {format(selectedDate, 'PPP')}:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-muted-foreground">$</span>
                    <Input
                      id="price-input"
                      type="number"
                      value={currentPriceInput}
                      onChange={(e) => setCurrentPriceInput(e.target.value)}
                      onBlur={handleSetPriceForSelectedDate}
                      className="w-24 h-9 text-base rounded-md shadow-sm"
                      min="0"
                      step="0.01"
                      aria-label={`Price per seat for ${format(selectedDate, 'PPP')}`}
                    />
                  </div>
                </div>
                <CardDescription className="mt-1 text-sm">
                  Default is ${DEFAULT_SEAT_PRICE.toFixed(2)}. Modifying sets a custom price.
                  Available seats: {availableSeatsCount}/{TOTAL_SEATS}.
                </CardDescription>
              </div>
            ) : (
              <CardDescription className="mt-2">
                Please select a date to see available seats, set prices, and book.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName" className="text-base font-medium flex items-center mb-1">
                    <User className="mr-2 h-5 w-5 text-primary" /> Booking Name:
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Enter name for booking"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-md shadow-sm"
                    aria-label="Booking name"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity" className="text-base font-medium flex items-center mb-1">
                    <Ticket className="mr-2 h-5 w-5 text-primary" /> Quantity:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={currentBookingQuantity <= 1 || availableSeatsCount === 0}>
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={bookingQuantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-20 text-center rounded-md shadow-sm"
                      min="1"
                      max={availableSeatsCount > 0 ? availableSeatsCount : 1} // Prevent error if availableSeatsCount is 0
                      disabled={availableSeatsCount === 0}
                      aria-label="Number of seats to book"
                    />
                    <Button variant="outline" size="icon" onClick={incrementQuantity} disabled={currentBookingQuantity >= availableSeatsCount || availableSeatsCount === 0}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedDate ? (
              availableSeatsCount <= 0 && (
                <div className="text-center mt-6 py-10 text-lg font-semibold text-destructive-foreground bg-destructive/80 rounded-md p-4 shadow">
                  Sorry, no seats available for this date.
                </div>
              )
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays size={48} className="mx-auto mb-2 opacity-50" />
                Pick a date from the calendar.
              </div>
            )}
          </CardContent>
          {selectedDate && (
            <CardFooter className="flex flex-col items-stretch gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Seat Price: ${seatPriceForSelectedDate.toFixed(2)}</p>
                <p className="text-lg font-semibold text-primary">
                  Est. Profit for {format(selectedDate, 'PPP')}: ${profitForSelectedDate.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Based on {bookedSeatsForSelectedDate.length} booked seat(s).</p>
              </div>

              {availableSeatsCount > 0 && (
                <>
                  {currentBookingQuantity > 0 && (
                    <div className="text-sm text-center text-primary font-medium p-2 bg-primary/10 rounded-md">
                      Booking: {currentBookingQuantity} seat{currentBookingQuantity !== 1 ? 's' : ''}
                      <br />
                      Total Cost: ${(currentBookingQuantity * seatPriceForSelectedDate).toFixed(2)}
                    </div>
                  )}
                  <Button
                    onClick={handleBooking}
                    disabled={currentBookingQuantity === 0 || !userName.trim() || availableSeatsCount === 0}
                    size="lg"
                    className="w-full text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Book {currentBookingQuantity > 0 ? `${currentBookingQuantity} Seat(s)` : 'Seats'}
                  </Button>
                </>
              )}
               {availableSeatsCount <= 0 && (
                 <div className="text-center py-2 text-lg font-semibold text-destructive-foreground bg-destructive/80 rounded-md p-4 shadow">
                    No seats available to book for this date.
                </div>
               )}
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

