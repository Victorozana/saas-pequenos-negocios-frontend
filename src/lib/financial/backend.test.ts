import { describe, expect, it } from "vitest";
import {
  isOverdue,
  localDay,
  parseStatement,
  parseTitles,
  periodQuery,
  type FinancialTitle,
} from "./backend";

const title: FinancialTitle = {
  id: "title",
  description: "Conta",
  originalAmount: 100,
  paidAmount: 40,
  balanceDue: 60,
  dueDate: "2026-10-24T02:59:59Z",
  status: "PartiallyPaid",
  customerId: null,
  quotationId: null,
};
describe("financial dates and contract", () => {
  it("uses the Sao Paulo calendar at a UTC day boundary and preserves partial overdue titles", () => {
    expect(localDay(title.dueDate)).toBe("2026-10-23");
    expect(isOverdue(title, "2026-10-24")).toBe(true);
    expect(isOverdue({ ...title, status: "Canceled" }, "2026-10-24")).toBe(
      false,
    );
    expect(
      isOverdue({ ...title, balanceDue: 0, status: "Paid" }, "2026-10-24"),
    ).toBe(false);
  });
  it("includes the complete final day in the API period", () => {
    const query = new URLSearchParams(periodQuery("2026-10-01", "2026-10-31"));
    expect(query.get("endDate")).toBe("2026-10-31T23:59:59.9999999-03:00");
  });
  it("rejects malformed money instead of rendering invalid balances", () => {
    expect(parseTitles([title])).toEqual([title]);
    expect(() => parseTitles([{ ...title, balanceDue: "60" }])).toThrow();
    expect(() => parseStatement({ totalReceivables: 100 })).toThrow();
  });
});
