/**
 * @jest-environment node
 */
import { runWithReadRetry } from "../../../prisma/connectivity";

const dropped = () => Object.assign(new Error("Connection terminated unexpectedly"), { code: "ECONNRESET" });

describe("runWithReadRetry", () => {
    it("retries a read once after a dropped connection", async () => {
        const run = jest.fn().mockRejectedValueOnce(dropped()).mockResolvedValueOnce(["row"]);
        await expect(runWithReadRetry("findMany", run, 0)).resolves.toEqual(["row"]);
        expect(run).toHaveBeenCalledTimes(2);
    });

    it("gives up after one retry", async () => {
        const run = jest.fn().mockRejectedValue(dropped());
        await expect(runWithReadRetry("findUnique", run, 0)).rejects.toThrow("Connection terminated");
        expect(run).toHaveBeenCalledTimes(2);
    });

    it("never retries writes", async () => {
        const run = jest.fn().mockRejectedValue(dropped());
        await expect(runWithReadRetry("create", run, 0)).rejects.toThrow();
        expect(run).toHaveBeenCalledTimes(1);
    });

    it("never retries ordinary query errors", async () => {
        const run = jest.fn().mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
        await expect(runWithReadRetry("findFirst", run, 0)).rejects.toThrow();
        expect(run).toHaveBeenCalledTimes(1);
    });
});
