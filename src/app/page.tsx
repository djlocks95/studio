
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { CustomCalendar } from '@/components/custom-calendar';
import { SeatSelection } from '@/components/seat-selection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Booking, DailyPrice, BookedSeatDetail, FirebaseBooking } from '@/lib/types';
import { addDays, format, isBefore, startOfDay, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle, DollarSign, User, BarChart3, MinusCircle, PlusCircle, BoxSelect, Grid3X3, Pencil, Trash2, Loader2 } from 'lucide-react';

const TOTAL_SEATS = 35;
const DEFAULT_SEAT_PRICE = 25;

// Helper functions for data conversion
const toFirebaseBooking = (booking: Booking): FirebaseBooking => ({
  ...booking,
  date: booking.date.toISOString(),
  seatPrices: booking.seatPrices ? Object.fromEntries(Object.entries(booking.seatPrices).map(([key, value]) => [String(key), value])) : undefined,
});

const fromFirebaseBooking = (fbBooking: FirebaseBooking): Booking => ({
  ...fbBooking,
  date: parseISO(fbBooking.date),
  seatPrices: fbBooking.seatPrices ? Object.fromEntries(Object.entries(fbBooking.seatPrices).map(([key, value]) => [Number(key), value])) : undefined,
});


export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [bookingQuantity, setBookingQuantity] = useState<string>('1');
  const [currentPriceInput, setCurrentPriceInput] = useState<string>(String(DEFAULT_SEAT_PRICE.toFixed(2)));
  
  const [editSeatPriceState, setEditSeatPriceState] = useState<{
    isOpen: boolean;
    bookingId: string;
    seatNumber: number;
    currentPrice: number;
    newPrice: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch initial data from Firebase
  useEffect(() => {
    setIsLoading(true);
    const bookingsRef = ref(db, 'bookings');
    const dailyPricesRef = ref(db, 'dailyPrices');

    const unsubscribeBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedBookings: Booking[] = Object.values(data as { [key: string]: FirebaseBooking }).map(fromFirebaseBooking);
        setCurrentBookings(fetchedBookings);
      } else {
        setCurrentBookings([]);
      }
      setError(null);
    }, (err) => {
      console.error("Firebase bookings fetch error:", err);
      setError("Failed to load bookings.");
      toast({ title: "Error", description: "Could not fetch bookings from database.", variant: "destructive" });
    });

    const unsubscribeDailyPrices = onValue(dailyPricesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedPrices: DailyPrice[] = Object.entries(data as { [key: string]: FirebaseDailyPrice['price'] }).map(([dateStr, price]) => ({
          date: parseISO(dateStr), // Assuming dateStr is YYYY-MM-DD, convert to full Date object
          price: price,
        }));
        setDailyPrices(fetchedPrices);
      } else {
        setDailyPrices([]);
      }
      setError(null);
    }, (err) => {
      console.error("Firebase daily prices fetch error:", err);
      setError("Failed to load daily prices.");
      toast({ title: "Error", description: "Could not fetch daily prices from database.", variant: "destructive" });
    });
    
    setIsLoading(false); // Set loading to false after subscriptions are set up

    return () => {
      unsubscribeBookings();
      unsubscribeDailyPrices();
    };
  }, [toast]);


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

  useEffect(() => {
    if (selectedSeats.length > 0) {
      setBookingQuantity(String(selectedSeats.length));
    }
    else if (selectedSeats.length === 0 && bookingQuantity !== '1' && parseInt(bookingQuantity,10) === 0 ) {
        setBookingQuantity('1');
    }
  }, [selectedSeats, bookingQuantity]);


  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSeats([]);
    setBookingQuantity('1');
  };

  const bookedSeatDetailsMap = useMemo(() => {
    const map = new Map<number, BookedSeatDetail>();
    if (!selectedDate) return map;

    const startOfSelected = startOfDay(selectedDate);
    currentBookings
      .filter(booking => startOfDay(booking.date).getTime() === startOfSelected.getTime())
      .forEach(booking => {
        booking.seats.forEach(seatNum => {
          map.set(seatNum, {
            bookingId: booking.id,
            userName: booking.userName,
            price: booking.seatPrices?.[seatNum] ?? getSeatPriceForDate(booking.date)
          });
        });
      });
    return map;
  }, [selectedDate, currentBookings, getSeatPriceForDate]);


  const handleSeatSelect = (seatNumber: number) => {
    if (!selectedDate || bookedSeatDetailsMap.has(seatNumber)) return;

    setSelectedSeats(prevSelectedSeats => {
      const newSelectedSeats = prevSelectedSeats.includes(seatNumber)
        ? prevSelectedSeats.filter(s => s !== seatNumber)
        : [...prevSelectedSeats, seatNumber];
      setBookingQuantity(String(newSelectedSeats.length > 0 ? newSelectedSeats.length : 1));
      return newSelectedSeats;
    });
  };

  const handleOpenEditSeatPriceDialog = (bookingId: string, seatNumber: number) => {
    const booking = currentBookings.find(b => b.id === bookingId);
    if (!booking) return;
    const currentPrice = booking.seatPrices?.[seatNumber] ?? getSeatPriceForDate(booking.date);
    setEditSeatPriceState({
      isOpen: true,
      bookingId,
      seatNumber,
      currentPrice,
      newPrice: String(currentPrice.toFixed(2)),
    });
  };

  const handleConfirmEditSeatPrice = async () => {
    if (!editSeatPriceState) return;
    const { bookingId, seatNumber, newPrice } = editSeatPriceState;
    const parsedNewPrice = parseFloat(newPrice);

    if (isNaN(parsedNewPrice) || parsedNewPrice < 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid positive price.", variant: "destructive" });
      return;
    }

    const bookingToUpdate = currentBookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive" });
        return;
    }

    const updatedSeatPrices = {
        ...(bookingToUpdate.seatPrices || {}),
        [seatNumber]: parsedNewPrice,
    };
    
    try {
      await update(ref(db, `bookings/${bookingId}`), { seatPrices: updatedSeatPrices });
      toast({ title: "Price Updated", description: `Price for seat ${seatNumber} updated to $${parsedNewPrice.toFixed(2)}.`, action: <CheckCircle2 className="text-green-500" /> });
      setEditSeatPriceState(null);
    } catch (e) {
      console.error("Firebase update error:", e);
      toast({ title: "Error", description: "Failed to update price in database.", variant: "destructive" });
    }
  };
  
  const handleUnbookSeat = async (bookingId: string, seatNumber: number) => {
    const bookingToUpdate = currentBookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive" });
        return;
    }

    const newSeats = bookingToUpdate.seats.filter(s => s !== seatNumber);
    const newSeatPrices = { ...bookingToUpdate.seatPrices };
    if (newSeatPrices) delete newSeatPrices[seatNumber];

    try {
        if (newSeats.length === 0) {
            await remove(ref(db, `bookings/${bookingId}`));
        } else {
            await update(ref(db, `bookings/${bookingId}`), { seats: newSeats, seatPrices: newSeatPrices });
        }
        toast({ title: "Seat Unbooked", description: `Seat ${seatNumber} has been unbooked.`, action: <Trash2 className="text-red-500" /> });
    } catch (e) {
        console.error("Firebase unbook error:", e);
        toast({ title: "Error", description: "Failed to unbook seat.", variant: "destructive" });
    }
  };

  const handleBookedSeatAction = (action: 'edit' | 'unbook', bookingId: string, seatNumber: number) => {
    if (action === 'edit') {
      handleOpenEditSeatPriceDialog(bookingId, seatNumber);
    } else if (action === 'unbook') {
      handleUnbookSeat(bookingId, seatNumber);
    }
  };


  const handleSetPriceForSelectedDate = async () => {
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

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      await set(ref(db, `dailyPrices/${dateStr}`), newPrice);
      toast({
        title: 'Price Updated',
        description: `Price for ${format(selectedDate, 'PPP')} set to $${newPrice.toFixed(2)}.`,
        action: <CheckCircle2 className="text-green-500" />
      });
    } catch (e) {
      console.error("Firebase set daily price error:", e);
      toast({ title: "Error", description: "Failed to set price in database.", variant: "destructive" });
    }
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

  const handleBooking = async () => {
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
      const stillAvailableSelectedSeats = selectedSeats.filter(s => !bookedSeatsForSelectedDate.includes(s));
      if (stillAvailableSelectedSeats.length !== selectedSeats.length) {
        toast({ title: 'Seat Conflict', description: 'Some selected seats were booked by another user. Please re-select.', variant: 'destructive', action: <AlertTriangle className="text-destructive-foreground" /> });
        setSelectedSeats(stillAvailableSelectedSeats);
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

    const newBookingId = `booking-${Date.now()}`;
    const newBooking: Booking = {
      id: newBookingId,
      date: selectedDate,
      seats: seatsToBook,
      userName: userName.trim(),
      seatPrices: bookingSeatPrices,
    };

    try {
      await set(ref(db, `bookings/${newBookingId}`), toFirebaseBooking(newBooking));
      const totalCost = quantityBooked * seatPriceForSelectedDate;
      toast({
        title: 'Booking Confirmed!',
        description: `${userName.trim()} booked ${quantityBooked} seat(s) for ${format(selectedDate, 'PPP')}. Total cost: $${totalCost.toFixed(2)}. Seats: ${seatsToBook.join(', ')}.`,
        action: <CheckCircle2 className="text-green-500" />,
      });
      setSelectedSeats([]);
      setUserName('');
      setBookingQuantity('1');
    } catch (e) {
      console.error("Firebase booking error:", e);
      toast({ title: "Error", description: "Failed to save booking to database.", variant: "destructive" });
    }
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
        // Fallback if seatPrices is somehow undefined, though it should always be set
        return totalProfit + (booking.seats.length * getSeatPriceForDate(booking.date));
      }, 0);
  }, [selectedDate, currentBookings, getSeatPriceForDate]);


  const disablePastDates = (date: Date) => isBefore(date, startOfDay(new Date()));

  const handleQuantityInputChange = (value: string) => {
    setSelectedSeats([]);
    const numValue = parseInt(value, 10);
    if (value === '') {
      setBookingQuantity('');
    } else if (!isNaN(numValue)) {
      if (numValue <= 0) setBookingQuantity('1');
      else if (numValue > availableSeatsCount) setBookingQuantity(String(availableSeatsCount));
      else setBookingQuantity(String(numValue));
    }
  };

  const incrementQuantity = () => {
    setSelectedSeats([]);
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity < availableSeatsCount) {
      setBookingQuantity(String(currentQuantity + 1));
    }
  };

  const decrementQuantity = () => {
    setSelectedSeats([]);
    const currentQuantity = parseInt(bookingQuantity, 10) || 0;
    if (currentQuantity > 1) {
      setBookingQuantity(String(currentQuantity - 1));
    }
  };
  
  const displayQuantity = selectedSeats.length > 0 ? selectedSeats.length : (parseInt(bookingQuantity, 10) || 0);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading booking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/50 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Reloading</Button>
      </div>
    );
  }

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
              Choose a date for booking. Hover over booked seats to see details. Click for actions.
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
                  Default is ${DEFAULT_SEAT_PRICE.toFixed(2)}. Modifying sets a custom price for new bookings.
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
                    <User className="mr-2 h-5 w-5 text-primary" /> Booking Name (for new bookings):
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Enter name for new booking"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-md shadow-sm"
                    aria-label="Booking name for new bookings"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium flex items-center mb-2">
                    <Grid3X3 className="mr-2 h-5 w-5 text-primary" /> Seat Map:
                  </Label>
                  <SeatSelection
                    totalSeats={TOTAL_SEATS}
                    bookedSeatDetails={bookedSeatDetailsMap}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                    onBookedSeatAction={handleBookedSeatAction}
                    disabled={!selectedDate || (availableSeatsCount === 0 && selectedSeats.length === 0)}
                  />
                   {selectedSeats.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {selectedSeats.length} seat(s) selected on map for new booking.
                    </p>
                  )}
                   <p className="text-xs text-muted-foreground mt-1 text-center">
                      Click available seat to select for new booking. Click booked seat for options.
                    </p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or Book by Quantity
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-base font-medium flex items-center mb-1">
                    <Ticket className="mr-2 h-5 w-5 text-primary" /> Number of Seats (for new booking):
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
                      New booking for {bookingQuantity} seat(s) by quantity (auto-assigned).
                    </p>
                  )}
                   {selectedSeats.length > 0 && (
                     <p className="text-xs text-muted-foreground mt-1">
                      Quantity input disabled when seats are selected on map for new booking.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {selectedDate ? (
              availableSeatsCount <= 0 && selectedSeats.length === 0 && (
                <div className="text-center mt-6 py-10 text-lg font-semibold text-destructive-foreground bg-destructive/80 rounded-md p-4 shadow">
                  Sorry, no seats available for new bookings on this date.
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
                <p className="text-sm text-muted-foreground">Default Seat Price for New Bookings: ${seatPriceForSelectedDate.toFixed(2)}</p>
                <p className="text-lg font-semibold text-primary">
                  Est. Profit for {format(selectedDate, 'PPP')}: ${profitForSelectedDate.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Based on {bookedSeatsForSelectedDate.length} booked seat(s).</p>
              </div>
              
              {(availableSeatsCount > 0 || selectedSeats.length > 0) && (
                <>
                  {displayQuantity > 0 && (
                    <div className="text-sm text-center text-primary font-medium p-2 bg-primary/10 rounded-md">
                      New Booking Summary: {displayQuantity} seat{displayQuantity !== 1 ? 's' : ''}
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
                    Confirm New Booking
                  </Button>
                </>
              )}
               {availableSeatsCount <= 0 && selectedSeats.length === 0 && (
                 <div className="text-center py-2 text-lg font-semibold text-destructive-foreground bg-destructive/80 rounded-md p-4 shadow">
                    No seats available for new bookings on this date.
                </div>
               )}
            </CardFooter>
          )}
        </Card>
      </main>

      {editSeatPriceState?.isOpen && (
        <Dialog open={editSeatPriceState.isOpen} onOpenChange={() => setEditSeatPriceState(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Price for Seat {editSeatPriceState.seatNumber}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="edit-seat-price">New Price ($)</Label>
              <Input
                id="edit-seat-price"
                type="number"
                value={editSeatPriceState.newPrice}
                onChange={(e) => setEditSeatPriceState(s => s ? {...s, newPrice: e.target.value} : null)}
                min="0"
                step="0.01"
              />
               <p className="text-sm text-muted-foreground">
                Original price: ${editSeatPriceState.currentPrice.toFixed(2)}
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setEditSeatPriceState(null)}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleConfirmEditSeatPrice}>Save Price</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kcrown Tickets. All rights reserved.</p>
        <p>Powered by Good Times & Great Music.</p>
      </footer>
    </div>
  );
}
