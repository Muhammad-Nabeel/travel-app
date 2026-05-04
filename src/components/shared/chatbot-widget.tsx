"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { AirportInput, type Airport } from "@/components/shared/airport-input";

type IntentKey = "flight_request" | "refund_issue" | "exchange_issue" | "terms_conditions";

type IntentOption = {
  key: IntentKey;
  label: string;
  prompt: string;
  description: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
};
type FareOption = {
  id: string;
  rank?: number;
  airline: string;
  route: string;
  departureDate: string;
  returnDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  numberOfStops?: number;
  rawOfferId?: string;
  price: string;
  currency: string;
  cabin?: string;
};

const BOT_WEBHOOK_URL = "https://chat.aimdigitallimited.co.uk/api/chat";

const INTENT_OPTIONS: IntentOption[] = [
  {
    key: "flight_request",
    label: "Flight request",
    prompt: "I need help with a flight booking request.",
    description: "Find and compare flight options quickly.",
  },
  {
    key: "refund_issue",
    label: "Refund issue",
    prompt: "I need support for a refund issue.",
    description: "Check refund policy and process guidance.",
  },
  {
    key: "exchange_issue",
    label: "Exchange issue",
    prompt: "I need support for a ticket exchange issue.",
    description: "Get help with date or ticket changes.",
  },
  {
    key: "terms_conditions",
    label: "Terms and conditions",
    prompt: "I want to know the terms and conditions.",
    description: "Read booking rules and service terms.",
  },
];

function getReply(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Sorry, I could not understand the response.";
  }
  const rec = data as Record<string, unknown>;
  const reply =
    (typeof rec.answer === "string" && rec.answer.trim()) ||
    (typeof rec.reply === "string" && rec.reply.trim()) ||
    (typeof rec.response === "string" && rec.response.trim()) ||
    (typeof rec.message === "string" && rec.message.trim()) ||
    "";
  return reply || "Sorry, I could not understand the response.";
}

function getFares(data: unknown): FareOption[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const rec = data as Record<string, unknown>;
  if (!Array.isArray(rec.fares)) return [];

  return rec.fares
    .map((item, idx) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const fare = item as Record<string, unknown>;
      const origin =
        (typeof fare.departure_airport === "string" &&
          fare.departure_airport.trim().toUpperCase()) ||
        (typeof fare.origin === "string" && fare.origin.trim().toUpperCase()) ||
        "";
      const destination =
        (typeof fare.arrival_airport === "string" &&
          fare.arrival_airport.trim().toUpperCase()) ||
        (typeof fare.destination === "string" &&
          fare.destination.trim().toUpperCase()) ||
        "";
      const route =
        (typeof fare.route === "string" && fare.route.trim()) ||
        (origin && destination ? `${origin} -> ${destination}` : "Route unavailable");
      const rawPrice =
        fare.total_price ?? fare.price ?? fare.total ?? fare.amount ?? fare.total_fare;
      const price =
        typeof rawPrice === "number"
          ? rawPrice.toFixed(2)
          : typeof rawPrice === "string"
            ? rawPrice
            : "0";

      return {
        id: `${Date.now()}-${idx}`,
        rank: typeof fare.rank === "number" ? fare.rank : undefined,
        airline:
          (typeof fare.validating_carrier === "string" &&
            fare.validating_carrier.trim()) ||
          (typeof fare.airline === "string" && fare.airline.trim()) ||
          (typeof fare.carrier === "string" && fare.carrier.trim()) ||
          "Recommended fare",
        route,
        departureDate:
          (typeof fare.departure_date === "string" && fare.departure_date.trim()) ||
          (typeof fare.departureDate === "string" && fare.departureDate.trim()) ||
          "Date unavailable",
        returnDate:
          (typeof fare.return_date === "string" && fare.return_date.trim()) ||
          (typeof fare.returnDate === "string" && fare.returnDate.trim()) ||
          undefined,
        departureTime:
          (typeof fare.departure_time === "string" && fare.departure_time.trim()) ||
          undefined,
        arrivalTime:
          (typeof fare.arrival_time === "string" && fare.arrival_time.trim()) ||
          undefined,
        numberOfStops:
          typeof fare.number_of_stops === "number" ? fare.number_of_stops : undefined,
        rawOfferId:
          (typeof fare.raw_offer_id === "string" && fare.raw_offer_id.trim()) ||
          undefined,
        price,
        currency:
          (typeof fare.currency === "string" && fare.currency.trim()) || "PKR",
        cabin:
          (typeof fare.cabin === "string" && fare.cabin.trim()) ||
          (typeof fare.travelClass === "string" && fare.travelClass.trim()) ||
          undefined,
      } satisfies FareOption;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<IntentKey | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Welcome! This is your travel agent chatbot. Please choose one of the following options to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fares, setFares] = useState<FareOption[]>([]);
  const [selectedFareId, setSelectedFareId] = useState<string | null>(null);
  const [submittedPhones, setSubmittedPhones] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const normalizedPhone = phone.trim();
  const isPhoneValid = /^0\d{10}$/.test(normalizedPhone);
  const hasPhoneInput = normalizedPhone.length > 0;

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isLoading]);

  async function callWebhook(message: string, intent: IntentKey | null) {
    const response = await fetch(BOT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        intent,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to connect to chatbot service.");
    }

    return (await response.json()) as unknown;
  }

  async function selectIntent(option: IntentOption) {
    if (isLoading) return;
    setSelectedIntent(option.key);
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: "user", content: option.label },
    ]);
    setIsLoading(true);

    try {
      const data = await callWebhook(option.prompt, option.key);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-b`, role: "bot", content: getReply(data) },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-u2`, role: "user", content: text }]);
    setIsLoading(true);

    try {
      const data = await callWebhook(text, selectedIntent);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-b2`, role: "bot", content: getReply(data) },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e2`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchFlightsStepByStep() {
    if (isLoading) return;
    if (!fromAirport || !toAirport || !departureDate.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-v`,
          role: "bot",
          content: "Please complete From, To, and Departure date first.",
        },
      ]);
      return;
    }

    const isOneWay = !returnDate.trim();
    const adultsCount = Math.max(1, Number.parseInt(adults || "1", 10) || 1);
    const summary = `I need the cheapest flight from ${fromAirport.iata} to ${toAirport.iata} on ${departureDate} for ${adultsCount} adult${adultsCount > 1 ? "s" : ""}${isOneWay ? "" : ` returning ${returnDate}`}`;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-fu`, role: "user", content: summary },
    ]);
    setFares([]);
    setSelectedFareId(null);
    setIsLoading(true);

    try {
      const response = await fetch(BOT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: summary,
          intent: "flight_request",
          trip: {
            origin: fromAirport.iata,
            destination: toAirport.iata,
            departure_date: departureDate,
            return_date: isOneWay ? null : returnDate,
            adults: adultsCount,
            currency: "PKR",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to connect to chatbot service.");
      }

      const data = (await response.json()) as unknown;
      const flightFares = getFares(data);
      setFares(flightFares);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-fb`, role: "bot", content: getReply(data) },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-fe`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function finalizeLead() {
    setSubmitError("");
    setSubmitSuccess("");
    const selectedFare = fares.find((fare) => fare.id === selectedFareId);
    if (!fromAirport || !toAirport || !departureDate.trim() || !selectedFare) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-lv`,
          role: "bot",
          content: "Please search and select a fare first.",
        },
      ]);
      return;
    }
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-lv2`,
          role: "bot",
          content: "Please provide full name, phone, and email to finalize.",
        },
      ]);
      return;
    }
    if (!/^0\d{10}$/.test(normalizedPhone)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-lv3`,
          role: "bot",
          content: "Please enter a valid mobile number in 11 digits, e.g. 03238864614.",
        },
      ]);
      return;
    }
    if (submittedPhones.includes(normalizedPhone)) {
      setSubmitError(
        "This mobile number has already been used for a request. Please use a different number.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const travelDates = selectedFare.returnDate
        ? `${selectedFare.departureDate} to ${selectedFare.returnDate}`
        : selectedFare.departureDate;

      const response = await fetch("/api/bookings/chatbot-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureCity: `${fromAirport.city} (${fromAirport.iata})`,
          destination: `${toAirport.city} (${toAirport.iata})`,
          travelDates,
          passengers: `${Math.max(1, Number.parseInt(adults || "1", 10) || 1)} adult(s)`,
          travelClass: selectedFare.cabin || "Economy",
          fullName: fullName.trim(),
          phone: normalizedPhone,
          email: email.trim(),
        }),
      });

      const data = (await response.json()) as { error?: string; reference?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to finalize lead.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ok`,
          role: "bot",
          content: `Lead created successfully. Reference: ${data.reference ?? "Generated"}`,
        },
      ]);
      setSubmitSuccess(
        `Request submitted successfully. Reference: ${data.reference ?? "Generated"}`,
      );
      setSubmittedPhones((prev) => [...prev, normalizedPhone]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "Unable to finalize lead.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-4 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between bg-sky-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Travel Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            <div className="flex flex-col gap-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "ml-auto rounded-br-sm bg-sky-500 text-white"
                      : "rounded-bl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700">
                  Choose an option to get started
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {INTENT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => void selectIntent(option)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        selectedIntent === option.key
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          selectedIntent === option.key
                            ? "text-sky-700"
                            : "text-slate-800"
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedIntent === "flight_request" && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                  <p className="text-xs font-semibold text-sky-800">
                    Flight details
                  </p>
                  <div className="mt-2 grid gap-2">
                    <AirportInput
                      value={fromText}
                      onChange={(raw) => {
                        setFromText(raw);
                        setFromAirport(null);
                      }}
                      onSelect={(airport) => {
                        setFromAirport(airport);
                        setFromText(`${airport.city} (${airport.iata})`);
                      }}
                      placeholder="Travel from"
                      inputClassName="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    <AirportInput
                      value={toText}
                      onChange={(raw) => {
                        setToText(raw);
                        setToAirport(null);
                      }}
                      onSelect={(airport) => {
                        setToAirport(airport);
                        setToText(`${airport.city} (${airport.iata})`);
                      }}
                      placeholder="Travel to"
                      inputClassName="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    <input
                      type="number"
                      min={1}
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                      placeholder="Adults"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-sky-700/90">
                      Leave return date empty for one-way search.
                    </p>
                    <button
                      type="button"
                      onClick={() => void searchFlightsStepByStep()}
                      disabled={isLoading}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      Search flights
                    </button>
                    {fares.length > 0 && (
                      <div className="mt-1 grid gap-2">
                        {fares.map((fare) => (
                          <button
                            key={fare.id}
                            type="button"
                            onClick={() => setSelectedFareId(fare.id)}
                            className={`rounded-lg border p-2 text-left text-xs ${
                              selectedFareId === fare.id
                                ? "border-sky-400 bg-sky-100"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{fare.airline}</p>
                            {typeof fare.rank === "number" ? (
                              <p className="text-slate-500">Option #{fare.rank}</p>
                            ) : null}
                            <p className="text-slate-600">{fare.route}</p>
                            {fare.departureTime || fare.arrivalTime ? (
                              <p className="text-slate-600">
                                {fare.departureTime ? `Dep: ${fare.departureTime}` : ""}
                                {fare.departureTime && fare.arrivalTime ? " | " : ""}
                                {fare.arrivalTime ? `Arr: ${fare.arrivalTime}` : ""}
                              </p>
                            ) : null}
                            {typeof fare.numberOfStops === "number" ? (
                              <p className="text-slate-600">Stops: {fare.numberOfStops}</p>
                            ) : null}
                            <p className="font-semibold text-slate-900">
                              {fare.currency} {fare.price}
                            </p>
                            {fare.rawOfferId ? (
                              <p className="text-slate-500">Offer: {fare.rawOfferId}</p>
                            ) : null}
                          </button>
                        ))}

                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                        />
                        <input
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 11),
                            )
                          }
                          placeholder="Phone number"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                        />
                        {hasPhoneInput ? (
                          <p
                            className={`text-[11px] ${
                              isPhoneValid ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {isPhoneValid
                              ? "Valid mobile number"
                              : "Invalid number. Use 11 digits like 03238864614."}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Enter 11-digit mobile number (e.g. 03238864614).
                          </p>
                        )}
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => void finalizeLead()}
                          disabled={
                            !selectedFareId ||
                            isLoading ||
                            !fullName.trim() ||
                            !email.trim() ||
                            !isPhoneValid
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Submit request
                        </button>
                        {submitError ? (
                          <p className="text-[11px] text-rose-600">{submitError}</p>
                        ) : null}
                        {submitSuccess ? (
                          <p className="text-[11px] text-emerald-700">
                            {submitSuccess}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                  Processing...
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sendMessage();
                }}
                placeholder="Type your message..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-12 text-sm outline-none focus:border-sky-500"
                disabled={isLoading}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-60"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <span className="sr-only">Open chatbot</span>
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/95">
              <span className="absolute -left-1 top-[8px] h-3 w-1.5 rounded-full border border-white/85 bg-white/20" />
              <span className="absolute -right-1 top-[8px] h-3 w-1.5 rounded-full border border-white/85 bg-white/20" />
              <span className="absolute -top-[3px] h-2 w-4.5 rounded-t-full border-t-2 border-white/85" />
              <span className="absolute top-[9px] left-[7px] h-1.5 w-1.5 animate-[blink_4s_ease-in-out_infinite] rounded-full bg-white" />
              <span className="absolute top-[9px] right-[7px] h-1.5 w-1.5 animate-[blink_4s_ease-in-out_infinite] rounded-full bg-white [animation-delay:0.2s]" />
              <span className="absolute bottom-[5px] h-2 w-3.5 rounded-b-full border-b-2 border-white/95" />
            </span>
            <style jsx>{`
              @keyframes blink {
                0%,
                44%,
                50%,
                100% {
                  transform: scaleY(1);
                  opacity: 1;
                }
                46%,
                48% {
                  transform: scaleY(0.15);
                  opacity: 0.8;
                }
              }
            `}</style>
          </>
        )}
      </button>
    </div>
  );
}
