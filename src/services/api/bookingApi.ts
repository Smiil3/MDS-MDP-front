import { apiGet, apiPost } from './httpClient';

export type BookingStatus = {
  id: number;
  label: string;
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
};

export type CreateBookingPayload = {
  appointment_date: string;
  id_mechanic: number;
  id_booking_status: number;
  id_vehicle: number;
  service_ids: number[];
};

export type Booking = {
  id: number;
  appointment_date: string;
  total_amount: number;
  id_mechanic: number;
  id_booking_status: number;
  id_driver: number;
  id_vehicle: number;
  createdAt: string;
};

type BookingStatusesResponse = {
  statuses: BookingStatus[];
};

type AvailableSlotsResponse = {
  slots: AvailableSlot[];
};

type CreateBookingResponse = {
  booking: Booking;
};

export async function getBookingStatuses(): Promise<BookingStatus[]> {
  const response = await apiGet<BookingStatusesResponse>('/api/booking-statuses');
  return response.statuses ?? [];
}

export async function getAvailableSlots(garageId: number, date: string): Promise<AvailableSlot[]> {
  const response = await apiGet<AvailableSlotsResponse>(
    `/api/garages/${garageId}/slots?date=${date}`,
  );
  return response.slots ?? [];
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await apiPost<CreateBookingResponse, CreateBookingPayload>(
    '/api/bookings',
    payload,
  );
  return response.booking;
}

export type MyBooking = {
  id_booking: number;
  appointment_date: string;
  total_amount: string;
  created_at: string;
  booking_status: { id_booking_status: number; label: string };
  mechanic: { id_mechanic: number; name: string; city: string; address: string };
  vehicle: { id_vehicle: number; brand: string; model: string; license_plate: string; fuel_type: string };
  booking_garage_service: { garage_service: { id_garage_service: number; category: string; label: string; price: string } }[];
};

type MyBookingsResponse = {
  bookings: MyBooking[];
};

export async function getMyBookings(): Promise<MyBooking[]> {
  const response = await apiGet<MyBookingsResponse>('/api/bookings/me');
  return response.bookings ?? [];
}
