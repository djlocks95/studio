
export interface Booking {
  id: string;
  date: Date; // Store as Date object for client-side, convert to string for DB
  seats: number[]; // Array of seat numbers (e.g., 1 to 35)
  userName: string; // Made mandatory
  seatPrices?: { [seatNumber: number]: number }; // Price paid for each seat
}

export interface Seat {
  id: number;
  isBooked: boolean;
  isSelected: boolean;
  isAvailable: boolean;
}

export interface DailyPrice {
  date: Date;
  price: number;
}
