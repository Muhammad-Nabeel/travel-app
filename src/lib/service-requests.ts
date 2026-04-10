export const SERVICE_REQUEST_TYPES = [
    "FLIGHT",
    "HOTEL",
    "UMRAH",
    "VISA",
    "TOUR",
] as const;

export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

export type ServiceRequestInput = {
    type: ServiceRequestType;
    title?: string;
    amount?: number;
    currency?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    payload: Record<string, unknown>;
};

const SERVICE_REQUEST_PREFIX: Record<ServiceRequestType, string> = {
    FLIGHT: "FL",
    HOTEL: "HT",
    UMRAH: "UM",
    VISA: "VS",
    TOUR: "TR",
};

export function isServiceRequestType(value: string): value is ServiceRequestType {
    return SERVICE_REQUEST_TYPES.includes(value as ServiceRequestType);
}

export function buildServiceRequestReference(type: ServiceRequestType) {
    const prefix = SERVICE_REQUEST_PREFIX[type];
    return `${prefix}-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function formatServiceRequestType(type: ServiceRequestType) {
    if (type === "FLIGHT") return "Flight";
    if (type === "HOTEL") return "Hotel";
    if (type === "UMRAH") return "Umrah";
    if (type === "VISA") return "Visa";
    return "Tour";
}

export async function submitServiceRequest(input: ServiceRequestInput) {
    const response = await fetch("/api/bookings/service-request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    const json = (await response.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
    };

    if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Unable to submit service request.");
    }

    return json;
}
