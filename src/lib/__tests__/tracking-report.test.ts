import { getTrackingReport } from "@/lib/analytics/tracking-report";
import { getGa4ReportingClient } from "@/lib/analytics/ga4";

const runReport = jest.fn();
const runRealtimeReport = jest.fn();

jest.mock("googleapis/build/src/apis/analyticsdata", () => ({
    analyticsdata: () => ({
        properties: {
            runReport: (...args: unknown[]) => runReport(...args),
            runRealtimeReport: (...args: unknown[]) => runRealtimeReport(...args),
        },
    }),
}));
jest.mock("@/lib/analytics/ga4", () => ({ getGa4ReportingClient: jest.fn() }));

const getClient = jest.mocked(getGa4ReportingClient);

type Body = { dimensions: { name: string }[] };

function rows(map: Record<string, number>) {
    return {
        data: {
            rows: Object.entries(map).map(([key, value]) => ({
                dimensionValues: [{ value: key }],
                metricValues: [{ value: String(value) }],
            })),
        },
    };
}

/** Answers each runReport call by the dimension it asks for. */
function respond(byDimension: Record<string, Record<string, number> | Error>) {
    runReport.mockImplementation(async ({ requestBody }: { requestBody: Body }) => {
        const result = byDimension[requestBody.dimensions[0].name];
        if (result instanceof Error) throw result;
        return rows(result ?? {});
    });
}

beforeEach(() => {
    jest.resetAllMocks();
    getClient.mockResolvedValue({ property: "properties/1", auth: {} } as never);
    runRealtimeReport.mockResolvedValue(rows({ search: 2 }));
});

it("explains how to connect GA4 when no credentials are stored", async () => {
    getClient.mockResolvedValue(null);
    await expect(getTrackingReport(30)).resolves.toMatchObject({ configured: false });
    expect(runReport).not.toHaveBeenCalled();
});

it("reports expected events, services and the flight funnel", async () => {
    respond({
        eventName: { search: 10, select_item: 5, purchase: 1, generate_lead: 4, page_view: 99 },
        "customEvent:search_type": { flight: 8, hotel: 2 },
        "customEvent:lead_type": { umrah: 3, contact: 1 },
        itemCategory: { tour: 6 },
    });

    const report = await getTrackingReport(30);
    if (!report.configured) throw new Error(report.reason);

    expect(report.warnings).toEqual([]);
    expect(report.events.find((e) => e.name === "search")).toMatchObject({ count: 10, liveCount: 2 });
    expect(report.events.find((e) => e.name === "sign_up")).toMatchObject({ count: 0, liveCount: 0 });
    expect(report.otherEvents).toEqual([{ name: "page_view", count: 99 }]);

    const metric = (service: string, label: string) =>
        report.services.find((s) => s.key === service)?.metrics.find((m) => m.label === label)?.value;
    expect(metric("flights", "Searches")).toBe(8);
    expect(metric("flights", "Bookings")).toBe(1);
    expect(metric("umrah", "Enquiries")).toBe(3);
    expect(metric("tours", "Package views")).toBe(6);
    expect(metric("contact", "Form & chat leads")).toBe(1);

    expect(report.funnel?.[0]).toMatchObject({ count: 8, percent: 100 });
    expect(report.funnel?.[1]).toMatchObject({ event: "select_item", count: 5, percent: 62.5 });
});

it("keeps the report when a custom dimension is not registered", async () => {
    respond({
        eventName: { search: 3 },
        "customEvent:search_type": new Error("Field customEvent:search_type is not a valid dimension."),
        "customEvent:lead_type": {},
        itemCategory: {},
    });

    const report = await getTrackingReport(7);
    if (!report.configured) throw new Error(report.reason);

    expect(report.funnel).toBeNull();
    expect(report.services[0].metrics[0]).toEqual({ label: "Searches", value: null });
    expect(report.warnings).toEqual([expect.stringContaining('register the custom dimension "search_type"')]);
});
