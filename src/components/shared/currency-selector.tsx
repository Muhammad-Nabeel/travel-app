"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrencySettings } from "@/lib/hooks/use-currency-settings";

interface CurrencySelectorProps {
    selectedCurrency: string;
    onCurrencyChange: (currency: string) => void;
    className?: string;
}

const currencySymbols: Record<string, string> = {
    PKR: "₨",
    USD: "$",
    EUR: "€",
    GBP: "£",
    SAR: "﷼",
    AED: "د.إ",
    JPY: "¥",
};

const currencyNames: Record<string, string> = {
    PKR: "Pakistani Rupee",
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    SAR: "Saudi Riyal",
    AED: "UAE Dirham",
    JPY: "Japanese Yen",
};

export function CurrencySelector({ selectedCurrency, onCurrencyChange, className = "" }: CurrencySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, loading } = useCurrencySettings();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Don't render if currency selector is disabled in admin settings
    if (loading || !settings.currencySelectorEnabled) {
        return null;
    }

    const availableCurrencies = settings.availableCurrencies;

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-foreground transition hover:bg-subtle"
                aria-label="Select currency"
            >
                <span className="text-muted">
                    {currencySymbols[selectedCurrency] || selectedCurrency}
                </span>
                <span>{selectedCurrency}</span>
                <ChevronDown className={`size-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-line bg-white py-2 shadow-raised">
                    {availableCurrencies.map((currency) => (
                        <button
                            key={currency}
                            type="button"
                            onClick={() => {
                                onCurrencyChange(currency);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition hover:bg-subtle ${
                                selectedCurrency === currency ? 'bg-brand-soft text-brand' : 'text-foreground'
                            }`}
                        >
                            <span className="text-lg font-medium">
                                {currencySymbols[currency] || currency}
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{currency}</span>
                                <span className="text-xs text-muted">{currencyNames[currency]}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}