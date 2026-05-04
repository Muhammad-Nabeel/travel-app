"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { AirportInput, type Airport } from "@/components/shared/airport-input";

type ServiceType = "flight" | "umrah" | "hotel" | "visa";

type FareOption = {
  id: string;
  airline: string;
  route: string;
  departureDate: string;
  returnDate?: string;
  price: string;
  currency: string;
  cabin?: string;
  summary?: string;
};

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  fares?: FareOption[];
};

type TravelerForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  fromText: string;
  toText: string;
  travelDates: string;
  passengers: string;
  travelClass: string;
};

const SERVICE_OPTIONS: Array<{ key: ServiceType; label: string }> = [
  { key: "flight", label: "Book a Flight" },
  { key: "umrah", label: "Book Umrah" },
  { key: "hotel", label: "Book Hotel" },
  { key: "visa", label: "Request Visa" },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function detectReply(payload: unknown): string {
  const root = asRecord(payload);
  if (!root) return "Sorry, I could not understand that.";
  return (
    toText(root.reply) ||
    toText(root.response) ||
    toText(root.message) ||
    toText(root.summary) ||
    "Sorry, I could not understand that."
  );
}

function detectFares(payload: unknown): FareOption[] {
  const root = asRecord(payload);
  if (!root) return [];

  const candidates = [root.fares, root.options, root.fare_options, root.results];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const normalized = candidate
      .map((entry, idx) => {
        const rec = asRecord(entry);
        if (!rec) return null;

        const origin = toText(rec.origin);
        const destination = toText(rec.destination);
        const route =
          toText(rec.route) ||
          (origin && destination ? `${origin} -> ${destination}` : "");
        const rawPrice = rec.price ?? rec.total ?? rec.total_fare ?? rec.amount;
        const price =
          typeof rawPrice === "number"
            ? rawPrice.toFixed(2)
            : toText(rawPrice) || "0";

        return {
          id: `${Date.now()}-${idx}`,
          airline: toText(rec.airline) || toText(rec.carrier) || "Recommended fare",
          route: route || "Route unavailable",
          departureDate:
            toText(rec.departure_date) || toText(rec.departureDate) || "Date unavailable",
          returnDate: toText(rec.return_date) || toText(rec.returnDate) || undefined,
          price,
          currency: toText(rec.currency) || "PKR",
          cabin: toText(rec.cabin) || toText(rec.travelClass) || undefined,
          summary: toText(rec.summary) || toText(rec.description) || undefined,
        } satisfies FareOption;
      })
      .filter((item): item is FareOption => item !== null);

    if (normalized.length > 0) return normalized;
  }

  return [];
}

function serviceTitle(service: ServiceType) {
  if (service === "flight") return "Flight";
  if (service === "umrah") return "Umrah";
  if (service === "hotel") return "Hotel";
  return "Visa";
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [form, setForm] = useState<TravelerForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    fromText: "",
    toText: "",
    travelDates: "",
    passengers: "1 adult",
    travelClass: "Economy",
  });
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Choose a booking type, fill your details, and I will guide the next step.",
    },
  ]);
  const [selectedFare, setSelectedFare] = useState<FareOption | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, selectedFare, status, error]);

  function setField<K extends keyof TravelerForm>(key: K, value: TravelerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateBaseFields() {
    if (
      !selectedService ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !fromAirport ||
      !toAirport
    ) {
      setError("Select service and complete name, phone, email, from, and to fields.");
      return false;
    }
    return true;
  }

  async function searchFlightsForSelection() {
    if (!validateBaseFields()) return;
    setError("");
    setStatus("");
    setSelectedFare(null);
    setIsLoading(true);

    const message =
      `Find best fares from ${fromAirport?.iata} to ${toAirport?.iata}` +
      (form.travelDates.trim() ? ` on ${form.travelDates.trim()}` : "") +
      ` for ${form.passengers.trim()} in ${form.travelClass.trim()} class.`;

    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", content: message }]);

    try {
      const response = await fetch("https://chat.aimdigitallimited.co.uk/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          trip: {
            origin: fromAirport?.iata,
            destination: toAirport?.iata,
            departure_date: form.travelDates.trim() || undefined,
            adults: 1,
            currency: "PKR",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch fares.");
      }

      const data = (await response.json()) as unknown;
      const fares = detectFares(data);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-b`,
          role: "bot",
          content:
            detectReply(data) ||
            (fares.length > 0 ? "I found options for you." : "No fares returned."),
          fares: fares.length > 0 ? fares : undefined,
        },
      ]);
      if (fares.length === 0) {
        setStatus(
          `No selectable fares returned for now. You can still create a ${serviceTitle(selectedService)} request below.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search flights.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createRequest() {
    if (!validateBaseFields() || !selectedService) return;
    setError("");
    setStatus("");
    setIsLoading(true);

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const departureCity = `${fromAirport?.city ?? ""} (${fromAirport?.iata ?? ""})`;
    const destination = `${toAirport?.city ?? ""} (${toAirport?.iata ?? ""})`;

    try {
      if (selectedService === "flight") {
        const chosenTravelDates =
          selectedFare?.returnDate && selectedFare?.departureDate
            ? `${selectedFare.departureDate} to ${selectedFare.returnDate}`
            : selectedFare?.departureDate || form.travelDates.trim();

        const response = await fetch("/api/bookings/chatbot-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departureCity,
            destination,
            travelDates: chosenTravelDates || "Flexible",
            passengers: form.passengers.trim(),
            travelClass: selectedFare?.cabin || form.travelClass.trim() || "Economy",
            fullName,
            phone: form.phone.trim(),
            email: form.email.trim(),
          }),
        });

        const data = (await response.json()) as { error?: string; reference?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to create flight request.");
        setStatus(`Flight booking request created. Reference: ${data.reference ?? "Generated"}`);
        return;
      }

      const type = selectedService.toUpperCase();
      const response = await fetch("/api/bookings/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: `${serviceTitle(selectedService)} request from chatbot`,
          customerName: fullName,
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
          amount: selectedFare ? Number(selectedFare.price.replace(/[^\d.]/g, "")) : undefined,
          currency: selectedFare?.currency || "PKR",
          payload: {
            source: "chatbot",
            service: selectedService,
            travelFrom: departureCity,
            travelTo: destination,
            travelDates: form.travelDates.trim(),
            passengers: form.passengers.trim(),
            travelClass: form.travelClass.trim(),
            selectedFare: selectedFare || null,
          },
        }),
      });

      const data = (await response.json()) as { error?: string; reference?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to create service request.");
      setStatus(`${serviceTitle(selectedService)} request created. Reference: ${data.reference ?? "Generated"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create request.");
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
      const response = await fetch("https://chat.aimdigitallimited.co.uk/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) throw new Error("Chat request failed.");
      const data = (await response.json()) as unknown;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-b2`,
          role: "bot",
          content: detectReply(data),
          fares: detectFares(data) || undefined,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-4 flex h-[560px] w-80 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:w-[25rem]">
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
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-700">Choose service</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SERVICE_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedService(item.key)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                      selectedService === item.key
                        ? "border-sky-400 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    placeholder="First name"
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                  />
                  <input
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    placeholder="Last name"
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>

                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="Phone number"
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="Email"
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                />

                <AirportInput
                  value={form.fromText}
                  onChange={(raw) => {
                    setField("fromText", raw);
                    setFromAirport(null);
                  }}
                  onSelect={(airport) => {
                    setField("fromText", `${airport.city} (${airport.iata})`);
                    setFromAirport(airport);
                  }}
                  placeholder="Travel from"
                  inputClassName="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                />
                <AirportInput
                  value={form.toText}
                  onChange={(raw) => {
                    setField("toText", raw);
                    setToAirport(null);
                  }}
                  onSelect={(airport) => {
                    setField("toText", `${airport.city} (${airport.iata})`);
                    setToAirport(airport);
                  }}
                  placeholder="Travel to"
                  inputClassName="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.travelDates}
                    onChange={(e) => setField("travelDates", e.target.value)}
                    placeholder="Travel date(s)"
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                  />
                  <input
                    value={form.passengers}
                    onChange={(e) => setField("passengers", e.target.value)}
                    placeholder="Passengers"
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={form.travelClass}
                  onChange={(e) => setField("travelClass", e.target.value)}
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                  <option value="First">First</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void searchFlightsForSelection()}
                    disabled={isLoading}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs font-semibold text-sky-700 disabled:opacity-70"
                  >
                    Search options
                  </button>
                  <button
                    type="button"
                    onClick={() => void createRequest()}
                    disabled={isLoading}
                    className="rounded-lg bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-70"
                  >
                    Create request
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                      msg.role === "user"
                        ? "ml-auto rounded-br-sm bg-sky-500 text-white"
                        : "rounded-bl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.fares && msg.fares.length > 0 && (
                    <div className="grid gap-2">
                      {msg.fares.map((fare) => (
                        <button
                          key={fare.id}
                          type="button"
                          onClick={() => setSelectedFare(fare)}
                          className={`rounded-lg border p-2 text-left text-xs ${
                            selectedFare?.id === fare.id
                              ? "border-sky-400 bg-sky-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{fare.airline}</p>
                          <p className="text-slate-600">{fare.route}</p>
                          <p className="text-slate-600">
                            {fare.departureDate}
                            {fare.returnDate ? ` | Return: ${fare.returnDate}` : ""}
                          </p>
                          <p className="font-semibold text-slate-900">
                            {fare.currency} {fare.price}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {selectedFare ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
                  Selected: {selectedFare.airline} | {selectedFare.route} | {selectedFare.currency}{" "}
                  {selectedFare.price}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
                  {error}
                </p>
              ) : null}
              {status ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
                  {status}
                </p>
              ) : null}

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
                placeholder="Ask anything..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-3 pr-12 text-xs outline-none focus:border-sky-500"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-60"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
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
