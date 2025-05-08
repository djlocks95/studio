
// Represents how data is stored in Firebase. Dates are ISO strings.
export interface FirebaseBooking {
  id: string;
  date: string; // ISO date string
  seats: number[];
  userName: string;
  seatPrices?: { [seatNumber: string]: number }; // seatNumber will be string key in Firebase
}

export interface FirebaseDailyPrice {
 price: number; // Stored directly under YYYY-MM-DD key
}

export interface FirebaseCommissionAgent {
  id: string;
  name: string;
  percentage: number;
  applicableDate?: string; // ISO date string, optional
}


// Represents how data is used in the client-side components. Dates are Date objects.
export interface Booking {
  id: string;
  date: Date;
  seats: number[];
  userName: string;
  seatPrices?: { [seatNumber: number]: number }; // Keep as number for client logic
}

export interface DailyPrice {
  date: Date; // Derived from the key in Firebase (YYYY-MM-DD)
  price: number;
}

export interface CommissionAgent {
  id: string;
  name: string;
  percentage: number;
  applicableDate?: Date; // Date object, optional
}

export interface BookedSeatDetail {
  bookingId: string;
  userName: string;
  price: number;
}
