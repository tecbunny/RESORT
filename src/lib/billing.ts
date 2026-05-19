import type { Room, Booking, Order, ServiceCharge, Payment } from '../types';

export function calculateRoomGST(ratePerNight: number): number {
  // GST Council Amendment: Room <= 7500 is 12%, > 7500 is 18%
  return ratePerNight > 7500 ? 18 : 12;
}

export function calculateRestaurantGST(ratePerNight: number): number {
  // GST Council Amendment: Restaurant in hotel with room > 7500 is 18%, else 5%
  return ratePerNight > 7500 ? 18 : 5;
}

export interface BillingSummary {
  nights: number;
  ratePerNight: number;
  totalRoomCharge: number;
  serviceTotal: number;
  roomGstRate: number;
  roomCgstAmount: number;
  roomSgstAmount: number;
  grandTotalRoom: number;

  restaurantBase: number;
  barTotal: number; // usually inclusive of VAT
  restGstRate: number;
  restCgstAmount: number;
  restSgstAmount: number;
  grandTotalFnB: number;

  grossTotal: number;
  totalPaid: number;
  balanceDue: number;
}

export function generateBillingSummary(
  _room: Room,
  booking: Booking | undefined,
  orders: Order[],
  services: ServiceCharge[],
  payments: Payment[]
): BillingSummary {
  const nights = booking && booking.checkIn && booking.checkOut && booking.checkOut !== booking.checkIn 
    ? Math.max(1, Math.floor((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)) 
    : 1;

  const ratePerNight = booking ? booking.tariff : 0;
  const totalRoomCharge = ratePerNight * nights;

  const linkedOrders = orders.filter(o => o.bookingId === booking?.id && o.status !== 'cancelled');
  const linkedServices = services.filter(c => c.bookingId === booking?.id);
  const linkedPayments = payments.filter(p => p.bookingId === booking?.id && !p.reversed);

  const serviceTotal = linkedServices.reduce((sum, charge) => sum + charge.amount, 0);

  // Part A: Room & Services
  const roomGstRate = calculateRoomGST(ratePerNight);
  const roomTaxableBase = totalRoomCharge + serviceTotal;
  const roomCgstAmount = (roomTaxableBase * (roomGstRate / 2)) / 100;
  const roomSgstAmount = (roomTaxableBase * (roomGstRate / 2)) / 100;
  const grandTotalRoom = roomTaxableBase + roomCgstAmount + roomSgstAmount;

  // Part B: F&B
  // Use exact subtotal and taxTotal calculated at POS to prevent rounding mismatches
  const restaurantOrders = linkedOrders.filter(o => o.type === 'restaurant');
  const restaurantBase = restaurantOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const restTaxTotal = restaurantOrders.reduce((sum, o) => sum + o.taxTotal, 0);
  
  const restGstRate = calculateRestaurantGST(ratePerNight);
  const restCgstAmount = restTaxTotal / 2;
  const restSgstAmount = restTaxTotal / 2;
  
  const barTotal = linkedOrders.filter(o => o.type === 'bar').reduce((sum, o) => sum + o.total, 0);
  const grandTotalFnB = restaurantBase + barTotal + restCgstAmount + restSgstAmount;

  const grossTotal = grandTotalRoom + grandTotalFnB;
  const totalPaid = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, grossTotal - totalPaid);

  return {
    nights, ratePerNight, totalRoomCharge, serviceTotal,
    roomGstRate, roomCgstAmount, roomSgstAmount, grandTotalRoom,
    restaurantBase, barTotal, restGstRate, restCgstAmount, restSgstAmount, grandTotalFnB,
    grossTotal, totalPaid, balanceDue
  };
}
