/**
 * @jest-environment node
 */
import { parse } from "pg-connection-string";

import { stripConnectionParams } from "../../../prisma/connection-url";

describe("stripConnectionParams", () => {
    it("keeps the database name when sslmode is followed by another parameter", () => {
        const url = stripConnectionParams("postgres://u:p@h:5432/app?sslmode=require&connection_limit=5");
        expect(url).toBe("postgres://u:p@h:5432/app?connection_limit=5");
        expect(parse(url).database).toBe("app");
    });

    it("removes sslmode and pgbouncer wherever they appear", () => {
        expect(stripConnectionParams("postgres://u:p@h/app?sslmode=disable")).toBe("postgres://u:p@h/app");
        expect(stripConnectionParams("postgres://u:p@h/app?pgbouncer=true&sslmode=require")).toBe("postgres://u:p@h/app");
        expect(stripConnectionParams("postgres://u:p@h/app?application_name=web&sslmode=require")).toBe(
            "postgres://u:p@h/app?application_name=web",
        );
    });

    it("leaves URLs without a query, and encoded passwords, untouched", () => {
        expect(stripConnectionParams("postgres://u:p%40ss@h/app")).toBe("postgres://u:p%40ss@h/app");
        expect(stripConnectionParams("postgres://u:p%40ss@h/app?sslmode=require")).toBe("postgres://u:p%40ss@h/app");
    });
});
