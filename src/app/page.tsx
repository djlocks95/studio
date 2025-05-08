
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CustomCalendar } from '@/components/custom-calendar';
import { SeatSelection } from '@/components/seat-selection'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Booking, DailyPrice } from '@/lib/types';
import { MOCK_BOOKINGS } from '@/data/mockBookings';
import { MOCK_DAILY_PRICES } from '@/data/mockDailyPrices';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle, DollarSign, User, BarChart3, MinusCircle, PlusCircle, BoxSelect, Grid3X3 } from 'lucide-react';

const TOTAL_SEATS = 35;
const DEFAULT_SEAT_PRICE = 25;

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentBookings, setCurrentBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>(MOCK_DAILY_PRICES);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]); 
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

  // Update bookingQuantity when selectedSeats change
  useEffect(() => {
    if (selectedSeats.length > 0) {
      setBookingQuantity(String(selectedSeats.length));
    }
    // If selectedSeats becomes empty, bookingQuantity retains its last value from quantity input
    // or defaults to '1' if it was also driven by selectedSeats.
    // User can then adjust quantity input if they clear seat map selection.
    else if (selectedSeats.length === 0 && bookingQuantity !== '1' && parseInt(bookingQuantity,10) === 0 ) {
        // if the quantity was set to 0 by clearing selected seats, set it to 1
        setBookingQuantity('1');
    }
  }, [selectedSeats, bookingQuantity]);


  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSeats([]); 
    setBookingQuantity('1'); 
  };

  const handleSeatSelect = (seatNumber: number) => {
    if (!selectedDate) return;
    if (bookedSeatsForSelectedDate.includes(seatNumber)) {
        toast({ title: "Seat Booked", description: "This seat is already booked.", variant: "destructive", action: <AlertTriangle className="text-destructive-foreground" /> });
        return;
    }

    setSelectedSeats(prevSelectedSeats => {
      const newSelectedSeats = prevSelectedSeats.includes(seatNumber)
        ? prevSelectedSeats.filter(s => s !== seatNumber)
        : [...prevSelectedSeats, seatNumber];
      
      // If no seats are selected via map, default quantity input to '1' to enable quantity booking mode.
      // Otherwise, quantity is driven by map selection.
      setBookingQuantity(String(newSelectedSeats.length > 0 ? newSelectedSeats.length : 1));
      return newSelectedSeats;
    });
  };


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
    if (!selectedDate) {
      toast({ title: 'Booking Incomplete', description: 'Please select a date.', variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
      return;
    }
    if (!userName.trim()) {
      toast({ title: 'User Name Required', description: 'Please enter a name for the booking.', variant: 'destructive', action: <User className="text-destructive-foreground" /> });
      return;
    }

    let seatsToBook: number[];
    let quantityBooked: number;

    if (selectedSeats.length > 0) {
      // Ensure all selected seats are actually available (double-check against bookedSeatsForSelectedDate)
      const stillAvailableSelectedSeats = selectedSeats.filter(s => !bookedSeatsForSelectedDate.includes(s));
      if (stillAvailableSelectedSeats.length !== selectedSeats.length) {
        toast({ title: 'Seat Conflict', description: 'Some selected seats were booked by another user. Please re-select.', variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
        setSelectedSeats(stillAvailableSelectedSeats); // Update UI to show only valid selections
        setBookingQuantity(String(stillAvailableSelectedSeats.length || 1));
        return;
      }
      seatsToBook = [...stillAvailableSelectedSeats];
      quantityBooked = seatsToBook.length;
      if (quantityBooked === 0) {
        toast({ title: 'No Seats Selected', description: 'Please select seats on the map or enter a quantity.', variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
        return;
      }
    } else {
      const quantityFromInput = parseInt(bookingQuantity, 10);
      if (isNaN(quantityFromInput) || quantityFromInput <= 0) {
        toast({ title: 'Invalid Quantity', description: 'Please enter a valid number of seats to book or select them on the map.', variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
        return;
      }
      quantityBooked = quantityFromInput;
      const allSeatNumbers = Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1);
      const currentlyAvailableSeatNumbers = allSeatNumbers.filter(
        seatNum => !bookedSeatsForSelectedDate.includes(seatNum)
      );
      if (quantityBooked > currentlyAvailableSeatNumbers.length) {
        toast({ title: 'Not Enough Seats', description: `Only ${currentlyAvailableSeatNumbers.length} seat(s) available for auto-assignment, but ${quantityBooked} were requested.`, variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
        return;
      }
      seatsToBook = currentlyAvailableSeatNumbers.slice(0, quantityBooked);
    }

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
    
    const totalCost = quantityBooked * seatPriceForSelectedDate;
    toast({
      title: 'Booking Confirmed!',
      description: `${userName.trim()} booked ${quantityBooked} seat(s) for ${format(selectedDate, 'PPP')}. Total cost: $${totalCost.toFixed(2)}. Seats: ${seatsToBook.join(', ')}.`,
      action: <CheckCircle2 className="text-green-500" />,
    });

    setSelectedSeats([]); 
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
        // Fallback if seatPrices is somehow missing (should not happen with new logic)
        return totalProfit + (booking.seats.length * getSeatPriceForDate(booking.date));
      }, 0);
  }, [selectedDate, currentBookings, getSeatPriceForDate]);

  const disablePastDates = (date: Date) => isBefore(date, startOfDay(new Date()));

  const handleQuantityInputChange = (value: string) => {
    setSelectedSeats([]); // Clear map selection if quantity input is directly used
    const numValue = parseInt(value, 10);
    if (value === '') {
      setBookingQuantity(''); // Allow empty for typing
    } else if (!isNaN(numValue)) {
      if (numValue <= 0) setBookingQuantity('1'); // Min 1 if has value
      else if (numValue > availableSeatsCount) setBookingQuantity(String(availableSeatsCount));
      else setBookingQuantity(String(numValue));
    }
  };

  const incrementQuantity = () => {
    setSelectedSeats([]); // Clear map selection
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity < availableSeatsCount) {
      setBookingQuantity(String(currentQuantity + 1));
    }
  };

  const decrementQuantity = () => {
    setSelectedSeats([]); // Clear map selection
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity > 1) {
      setBookingQuantity(String(currentQuantity - 1));
    }
  };
  
  const displayQuantity = selectedSeats.length > 0 ? selectedSeats.length : (parseInt(bookingQuantity, 10) || 0);

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
              <div className="space-y-6">
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
                  <Label className="text-base font-medium flex items-center mb-2">
                    <Grid3X3 className="mr-2 h-5 w-5 text-primary" /> Select Seats on Map:
                  </Label>
                  <SeatSelection
                    totalSeats={TOTAL_SEATS}
                    bookedSeats={bookedSeatsForSelectedDate}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                    disabled={!selectedDate || availableSeatsCount === 0 && selectedSeats.length === 0}
                  />
                   {selectedSeats.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {selectedSeats.length} seat(s) selected on map. Booking quantity set to {selectedSeats.length}.
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-base font-medium flex items-center mb-1">
                    <Ticket className="mr-2 h-5 w-5 text-primary" /> Book by Quantity:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={decrementQuantity} 
                      disabled={(parseInt(bookingQuantity, 10) || 0) <= 1 || availableSeatsCount === 0 || selectedSeats.length > 0}
                      aria-label="Decrement seat quantity"
                    >
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={bookingQuantity}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      className="w-20 text-center rounded-md shadow-sm"
                      min="1"
                      max={availableSeatsCount > 0 ? availableSeatsCount : 1} 
                      disabled={availableSeatsCount === 0 || selectedSeats.length > 0}
                      aria-label="Number of seats to book by quantity"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={incrementQuantity} 
                      disabled={(parseInt(bookingQuantity, 10) || 0) >= availableSeatsCount || availableSeatsCount === 0 || selectedSeats.length > 0}
                      aria-label="Increment seat quantity"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  {selectedSeats.length === 0 && (parseInt(bookingQuantity, 10) || 0) > 0 && (
                     <p className="text-xs text-muted-foreground mt-1">
                      Booking {bookingQuantity} seat(s) by quantity (auto-assigned).
                    </p>
                  )}
                   {selectedSeats.length > 0 && (
                     <p className="text-xs text-muted-foreground mt-1">
                      Quantity input disabled when seats are selected on map.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {selectedDate ? (
              availableSeatsCount <= 0 && selectedSeats.length === 0 && ( // Show if no available seats AND no seats are somehow selected (edge case)
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
              
              {/* Show booking summary and button if seats can be booked */}
              {(availableSeatsCount > 0 || selectedSeats.length > 0) && (
                <>
                  {displayQuantity > 0 && (
                    <div className="text-sm text-center text-primary font-medium p-2 bg-primary/10 rounded-md">
                      Booking: {displayQuantity} seat{displayQuantity !== 1 ? 's' : ''}
                      <br />
                      Total Cost: ${(displayQuantity * seatPriceForSelectedDate).toFixed(2)}
                    </div>
                  )}
                  <Button
                    onClick={handleBooking}
                    disabled={displayQuantity === 0 || !userName.trim() || (availableSeatsCount === 0 && selectedSeats.length === 0)}
                    size="lg"
                    className="w-full text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Book {displayQuantity > 0 ? `${displayQuantity} Seat(s)` : 'Seats'}
                  </Button>
                </>
              )}
               {availableSeatsCount <= 0 && selectedSeats.length === 0 && (
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

