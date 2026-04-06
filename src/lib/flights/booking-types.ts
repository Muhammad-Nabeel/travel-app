/**
 * Booking / passenger detail types — extend here as fields are added.
 */

import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";

export type PassengerType = "adult" | "child" | "infant";

export type PassengerDetails = {
    /** Internal index, 0-based within the passenger type group */
    index: number;
    type: PassengerType;
    firstName: string;
    lastName: string;
    /** ISO 8601 date string "YYYY-MM-DD" */
    dateOfBirth: string;
    /** ISO 8601 date string "YYYY-MM-DD" */
    passportExpiry: string;
    wheelchairRequired: boolean;
};

export type ContactDetails = {
    /** Full international number e.g. +92 300 1234567 */
    phone: string;
    /** Used for e-ticket delivery */
    email: string;
};

export type BookingFormState = {
    contact: ContactDetails;
    passengers: PassengerDetails[];
};

/**
 * Complete, database-ready booking payload produced by the passenger form.
 * Persist this to the `bookings` table when payment is confirmed.
 */
export type BookingPayload = {
    /** Full FlightOffer object as returned by the search service */
    offer: FlightOffer;
    /** Original search query used to find this offer */
    query: FlightSearchQuery;
    /** Contact person who made the booking */
    contact: ContactDetails;
    /** All passengers, ordered by type (adults → children → infants) */
    passengers: PassengerDetails[];
    /** ISO 8601 timestamp when the booking was initiated */
    createdAt: string;
};
