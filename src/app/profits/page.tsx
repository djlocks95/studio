
'use client';

import * as React from 'react';
import Link from 'next/link';
import { MOCK_BOOKINGS } from '@/data/mockBookings';
import { MOCK_DAILY_PRICES } from '@/data/mockDailyPrices';
import type { Booking, DailyPrice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay, getMonth, getYear } from 'date-fns';
import { ArrowLeft, BarChart3, CalendarDays, TrendingUp } from 'lucide-react';

const DEFAULT_SEAT_PRICE = 25; // Should match default in main page

interface DailyProfit {
  date: string;
  profit: number;
  bookedSeats: number;
}

interface MonthlyProfit {
  month: string; // YYYY-MM format
  profit: number;
  bookedSeats: number;
}

export default function ProfitsPage() {
  const [bookings] = React.useState<Booking[]>(MOCK_BOOKINGS);
  const [dailyPricesData] = React.useState<DailyPrice[]>(MOCK_DAILY_PRICES);

  const getSeatPriceForDate = React.useCallback((date: Date): number => {
    const specificPriceEntry = dailyPricesData.find(
      dp => startOfDay(dp.date).getTime() === startOfDay(date).getTime()
    );
    return specificPriceEntry ? specificPriceEntry.price : DEFAULT_SEAT_PRICE;
  }, [dailyPricesData]);

  const dailyProfits = React.useMemo(() => {
    const profitsMap = new Map<string, { profit: number; bookedSeats: number }>();

    bookings.forEach(booking => {
      const dateStr = format(booking.date, 'yyyy-MM-dd');
      let currentData = profitsMap.get(dateStr) || { profit: 0, bookedSeats: 0 };
      let bookingProfit = 0;

      if (booking.seatPrices) {
        bookingProfit = Object.values(booking.seatPrices).reduce((sum, price) => sum + price, 0);
      } else {
        // Fallback for older data
        const pricePerSeat = getSeatPriceForDate(booking.date);
        bookingProfit = booking.seats.length * pricePerSeat;
      }
      
      currentData.profit += bookingProfit;
      currentData.bookedSeats += booking.seats.length;
      profitsMap.set(dateStr, currentData);
    });

    const sortedDailyProfits: DailyProfit[] = Array.from(profitsMap.entries())
      .map(([date, data]) => ({ date, profit: data.profit, bookedSeats: data.bookedSeats }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

    return sortedDailyProfits;
  }, [bookings, getSeatPriceForDate]);

  const monthlyProfits = React.useMemo(() => {
    const profitsMap = new Map<string, { profit: number; bookedSeats: number }>();

    dailyProfits.forEach(daily => {
      const monthStr = format(new Date(daily.date), 'yyyy-MM');
      let currentData = profitsMap.get(monthStr) || { profit: 0, bookedSeats: 0 };
      currentData.profit += daily.profit;
      currentData.bookedSeats += daily.bookedSeats;
      profitsMap.set(monthStr, currentData);
    });
    
    const sortedMonthlyProfits: MonthlyProfit[] = Array.from(profitsMap.entries())
      .map(([month, data]) => ({ month, profit: data.profit, bookedSeats: data.bookedSeats }))
      .sort((a, b) => { // Sort by year then month, descending
        const [yearA, monthA] = a.month.split('-').map(Number);
        const [yearB, monthB] = b.month.split('-').map(Number);
        if (yearB !== yearA) return yearB - yearA;
        return monthB - monthA;
      });

    return sortedMonthlyProfits;
  }, [dailyProfits]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Profit Analytics
            </h1>
          </div>
          <Link href="/" passHref>
            <Button variant="outline" className="shadow-md">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Booking
            </Button>
          </Link>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          Track your daily and monthly earnings.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CalendarDays className="mr-2 text-primary" />
              Daily Profits
            </CardTitle>
            <CardDescription>Profits generated each day from bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyProfits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="text-center">Booked Seats</TableHead>
                    <TableHead className="text-right">Total Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyProfits.map(item => (
                    <TableRow key={item.date}>
                      <TableCell className="font-medium">{format(new Date(item.date), 'PPP')}</TableCell>
                      <TableCell className="text-center">{item.bookedSeats}</TableCell>
                      <TableCell className="text-right font-semibold">${item.profit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No daily profit data available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <TrendingUp className="mr-2 text-primary" />
              Monthly Profits
            </CardTitle>
            <CardDescription>Aggregated profits for each month.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyProfits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Month</TableHead>
                  <TableHead className="text-center">Total Booked Seats</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyProfits.map(item => (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">{format(new Date(item.month + '-02'), 'MMMM yyyy')}</TableCell> 
                    <TableCell className="text-center">{item.bookedSeats}</TableCell>
                    <TableCell className="text-right font-semibold">${item.profit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No monthly profit data available.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kcrown Tickets. Profit Dashboard.</p>
      </footer>
    </div>
  );
}
