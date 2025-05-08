
'use client';

import * as React from 'react';
import Link from 'next/link';
import { MOCK_BOOKINGS } from '@/data/mockBookings';
import { MOCK_DAILY_PRICES } from '@/data/mockDailyPrices';
import { MOCK_COMMISSION_AGENTS } from '@/data/mockCommissionAgents';
import type { Booking, DailyPrice, CommissionAgent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay } from 'date-fns';
import { ArrowLeft, BarChart3, CalendarDays, TrendingUp, Users, Percent, PlusCircle, Edit, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DEFAULT_SEAT_PRICE = 25;

interface DailyProfitMetrics {
  date: string;
  grossProfit: number;
  bookedSeats: number;
  commissionPaid: number;
  netProfit: number;
}

interface MonthlyProfitMetrics {
  month: string; // YYYY-MM format
  grossProfit: number;
  bookedSeats: number;
  commissionPaid: number;
  netProfit: number;
}

export default function ProfitsPage() {
  const [bookings] = React.useState<Booking[]>(MOCK_BOOKINGS);
  const [dailyPricesData] = React.useState<DailyPrice[]>(MOCK_DAILY_PRICES);
  const [commissionAgents, setCommissionAgents] = React.useState<CommissionAgent[]>(MOCK_COMMISSION_AGENTS);
  
  const [newAgentName, setNewAgentName] = React.useState('');
  const [newAgentPercentage, setNewAgentPercentage] = React.useState('');
  
  const [editingAgent, setEditingAgent] = React.useState<CommissionAgent | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editPercentage, setEditPercentage] = React.useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const getSeatPriceForDate = React.useCallback((date: Date): number => {
    const specificPriceEntry = dailyPricesData.find(
      dp => startOfDay(dp.date).getTime() === startOfDay(date).getTime()
    );
    return specificPriceEntry ? specificPriceEntry.price : DEFAULT_SEAT_PRICE;
  }, [dailyPricesData]);

  const calculateTotalCommission = React.useCallback((profitAmount: number, agents: CommissionAgent[]): number => {
    return agents.reduce((totalComm, agent) => {
      return totalComm + (profitAmount * (agent.percentage / 100));
    }, 0);
  }, []);

  const dailyProfits = React.useMemo(() => {
    const profitsMap = new Map<string, { grossProfit: number; bookedSeats: number }>();

    bookings.forEach(booking => {
      const dateStr = format(booking.date, 'yyyy-MM-dd');
      let currentData = profitsMap.get(dateStr) || { grossProfit: 0, bookedSeats: 0 };
      let bookingGrossProfit = 0;

      if (booking.seatPrices) {
        bookingGrossProfit = Object.values(booking.seatPrices).reduce((sum, price) => sum + price, 0);
      } else {
        const pricePerSeat = getSeatPriceForDate(booking.date);
        bookingGrossProfit = booking.seats.length * pricePerSeat;
      }
      
      currentData.grossProfit += bookingGrossProfit;
      currentData.bookedSeats += booking.seats.length;
      profitsMap.set(dateStr, currentData);
    });

    const sortedDailyProfits: DailyProfitMetrics[] = Array.from(profitsMap.entries())
      .map(([date, data]) => {
        const commissionPaid = calculateTotalCommission(data.grossProfit, commissionAgents);
        const netProfit = data.grossProfit - commissionPaid;
        return { 
          date, 
          grossProfit: data.grossProfit, 
          bookedSeats: data.bookedSeats,
          commissionPaid,
          netProfit
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sortedDailyProfits;
  }, [bookings, getSeatPriceForDate, commissionAgents, calculateTotalCommission]);

  const monthlyProfits = React.useMemo(() => {
    const profitsMap = new Map<string, { grossProfit: number; bookedSeats: number; commissionPaid: number; netProfit: number }>();

    dailyProfits.forEach(daily => {
      const monthStr = format(new Date(daily.date), 'yyyy-MM');
      let currentData = profitsMap.get(monthStr) || { grossProfit: 0, bookedSeats: 0, commissionPaid: 0, netProfit: 0 };
      currentData.grossProfit += daily.grossProfit;
      currentData.bookedSeats += daily.bookedSeats;
      currentData.commissionPaid += daily.commissionPaid;
      currentData.netProfit += daily.netProfit;
      profitsMap.set(monthStr, currentData);
    });
    
    const sortedMonthlyProfits: MonthlyProfitMetrics[] = Array.from(profitsMap.entries())
      .map(([month, data]) => ({ 
        month, 
        grossProfit: data.grossProfit, 
        bookedSeats: data.bookedSeats,
        commissionPaid: data.commissionPaid,
        netProfit: data.netProfit
       }))
      .sort((a, b) => {
        const [yearA, monthA] = a.month.split('-').map(Number);
        const [yearB, monthB] = b.month.split('-').map(Number);
        if (yearB !== yearA) return yearB - yearA;
        return monthB - monthA;
      });

    return sortedMonthlyProfits;
  }, [dailyProfits]);

  const handleAddAgent = () => {
    const percentageVal = parseFloat(newAgentPercentage);
    if (!newAgentName.trim() || isNaN(percentageVal) || percentageVal < 0 || percentageVal > 100) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid name and percentage (0-100).',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }
    const newAgent: CommissionAgent = {
      id: `agent-${Date.now()}`,
      name: newAgentName.trim(),
      percentage: percentageVal,
    };
    setCommissionAgents(prev => [...prev, newAgent]);
    setNewAgentName('');
    setNewAgentPercentage('');
    toast({
      title: 'Agent Added',
      description: `${newAgent.name} added with ${newAgent.percentage}% commission.`,
      action: <CheckCircle2 className="text-green-500" />,
    });
  };

  const handleRemoveAgent = (agentId: string) => {
    setCommissionAgents(prev => prev.filter(agent => agent.id !== agentId));
    toast({
      title: 'Agent Removed',
      description: 'Commission agent has been removed.',
      action: <Trash2 className="text-green-500" />,
    });
  };

  const handleOpenEditDialog = (agent: CommissionAgent) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditPercentage(String(agent.percentage));
    setIsEditDialogOpen(true);
  };

  const handleSaveAgentEdit = () => {
    if (!editingAgent) return;
    const percentageVal = parseFloat(editPercentage);
    if (!editName.trim() || isNaN(percentageVal) || percentageVal < 0 || percentageVal > 100) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid name and percentage (0-100).',
        variant: 'destructive',
        action: <AlertTriangle className="text-destructive-foreground" />,
      });
      return;
    }
    setCommissionAgents(prev => 
      prev.map(agent => 
        agent.id === editingAgent.id 
        ? { ...agent, name: editName.trim(), percentage: percentageVal } 
        : agent
      )
    );
    setIsEditDialogOpen(false);
    setEditingAgent(null);
    toast({
      title: 'Agent Updated',
      description: 'Commission agent details updated successfully.',
      action: <CheckCircle2 className="text-green-500" />,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center w-full max-w-5xl">
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
          Track your daily and monthly earnings, and manage commissions.
        </p>
      </header>

      <main className="w-full max-w-5xl space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Users className="mr-2 text-primary" />
              Commission Configuration
            </CardTitle>
            <CardDescription>Manage commission agents and their percentages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-card shadow-sm">
              <div>
                <Label htmlFor="agentName" className="font-medium">Agent Name</Label>
                <Input 
                  id="agentName" 
                  placeholder="e.g. John Doe" 
                  value={newAgentName} 
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="agentPercentage" className="font-medium">Commission (%)</Label>
                <Input 
                  id="agentPercentage" 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={newAgentPercentage}
                  onChange={(e) => setNewAgentPercentage(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddAgent} className="shadow-md md:mt-0 mt-4">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Agent
              </Button>
            </div>

            {commissionAgents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionAgents.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell className="text-center">{agent.percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(agent)} className="shadow-sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveAgent(agent.id)} className="shadow-sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No commission agents configured yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CalendarDays className="mr-2 text-primary" />
              Daily Profits
            </CardTitle>
            <CardDescription>Profits generated each day from bookings, including commission breakdown.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyProfits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="text-center">Booked Seats</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyProfits.map(item => (
                    <TableRow key={item.date}>
                      <TableCell className="font-medium">{format(new Date(item.date), 'PPP')}</TableCell>
                      <TableCell className="text-center">{item.bookedSeats}</TableCell>
                      <TableCell className="text-right">${item.grossProfit.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-destructive">-${item.commissionPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">${item.netProfit.toFixed(2)}</TableCell>
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
            <CardDescription>Aggregated profits for each month, including commission breakdown.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyProfits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Month</TableHead>
                  <TableHead className="text-center">Total Booked Seats</TableHead>
                  <TableHead className="text-right">Total Gross Profit</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead className="text-right">Total Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyProfits.map(item => (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">{format(new Date(item.month + '-02'), 'MMMM yyyy')}</TableCell> 
                    <TableCell className="text-center">{item.bookedSeats}</TableCell>
                    <TableCell className="text-right">${item.grossProfit.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive">-${item.commissionPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${item.netProfit.toFixed(2)}</TableCell>
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

      {editingAgent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Commission Agent</DialogTitle>
              <DialogDescription>
                Update the details for {editingAgent.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">Name</Label>
                <Input 
                  id="editName" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPercentage" className="text-right">Percentage (%)</Label>
                <Input 
                  id="editPercentage" 
                  type="number" 
                  value={editPercentage} 
                  onChange={(e) => setEditPercentage(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1" 
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveAgentEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kcrown Tickets. Profit Dashboard.</p>
      </footer>
    </div>
  );
