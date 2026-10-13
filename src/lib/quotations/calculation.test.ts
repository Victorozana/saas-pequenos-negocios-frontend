import { describe, expect, it } from "vitest";
import { quotationCents, quotationItemTotal, quotationSubtotal, quotationTotal } from "./calculation";

describe("quotation calculations", () => {
  it("rounds each item away from zero before discount and sum", () => {
    expect(quotationSubtotal(0.05, 0.5)).toBe(BigInt(3));
    expect(quotationItemTotal({ unitPrice: 0.05, quantity: 0.5, discountAmount: 0.03 })).toBe(BigInt(0));
    expect(quotationTotal(Array(2).fill({ unitPrice: 0.01, quantity: 0.5, discountAmount: 0 }))).toBe(BigInt(2));
    expect(quotationSubtotal(1.01, 3)).toBe(BigInt(303));
  });
  it("accepts exact decimal boundary without float precision loss", () => {
    expect(quotationCents("9999999999999999.99")).toBe(BigInt("999999999999999999"));
    expect(quotationSubtotal("9999999999999999.99", "1")).toBe(BigInt("999999999999999999"));
    expect(quotationSubtotal(0, "9999999999999999.99")).toBe(BigInt(0));
  });
  it("rejects excess precision, invalid values and persistent numeric overflow", () => {
    for (const value of [0.001, -1, NaN, Infinity, "10000000000000000", "9999999999999999.999"]) {
      expect(() => quotationCents(value)).toThrow();
    }
    expect(() => quotationSubtotal(0, 0)).toThrow();
    expect(() => quotationSubtotal(0, 0.001)).toThrow();
    expect(() => quotationSubtotal("9999999999999999.99", 2)).toThrow();
    expect(() => quotationItemTotal({ unitPrice: 0.05, quantity: 0.5, discountAmount: 0.04 })).toThrow();
    expect(() => quotationTotal([
      { unitPrice: "9999999999999999.99", quantity: 1, discountAmount: 0 },
      { unitPrice: 0.01, quantity: 1, discountAmount: 0 },
    ])).toThrow();
  });
});
