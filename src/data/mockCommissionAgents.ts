
import type { CommissionAgent } from '@/lib/types';
import { addDays, startOfDay } from 'date-fns';

const today = startOfDay(new Date());

export const MOCK_COMMISSION_AGENTS: CommissionAgent[] = [
  { id: 'agent-1627890123456', name: 'John Doe (Global)', percentage: 5 }, // Global commission
  { id: 'agent-1627890234567', name: 'Jane Smith (Specific Date)', percentage: 7.5, applicableDate: addDays(today, 5) },
  { id: 'agent-1627890345678', name: 'Mike Ross (Global Higher)', percentage: 10 },
  { id: 'agent-1627890456789', name: 'Sarah Connor (Future Date)', percentage: 3, applicableDate: addDays(today, 10) },
];

