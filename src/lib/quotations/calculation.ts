const maximum = BigInt("999999999999999999");
const hundred = BigInt(100);

/** Parse decimal input without floating point multiplication or rounding. */
export function quotationCents(value: number | string): bigint {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Use valores não negativos com até duas casas decimais.");
  }
  const [whole, fraction = ""] = text.split(".");
  const cents = BigInt(whole) * hundred + BigInt(fraction.padEnd(2, "0"));
  if (cents > maximum) throw new Error("O valor excede o limite permitido.");
  return cents;
}

export function quotationSubtotal(price: number | string, quantity: number | string): bigint {
  const units = quotationCents(quantity);
  if (units === BigInt(0)) throw new Error("A quantidade deve ser maior que zero.");
  const subtotal = (quotationCents(price) * units + BigInt(50)) / hundred;
  if (subtotal > maximum) throw new Error("O subtotal excede o limite permitido.");
  return subtotal;
}

export function quotationItemTotal(item: { unitPrice: number | string; quantity: number | string; discountAmount: number | string }): bigint {
  const subtotal = quotationSubtotal(item.unitPrice, item.quantity);
  const discount = quotationCents(item.discountAmount);
  if (discount > subtotal) throw new Error("O desconto não pode ser maior que o subtotal.");
  return subtotal - discount;
}

export function quotationTotal(items: Parameters<typeof quotationItemTotal>[0][]): bigint {
  let subtotal = BigInt(0), discount = BigInt(0);
  for (const item of items) {
    quotationItemTotal(item);
    subtotal += quotationSubtotal(item.unitPrice, item.quantity);
    discount += quotationCents(item.discountAmount);
  }
  if (subtotal > maximum || discount > maximum) throw new Error("O orçamento excede o limite permitido.");
  return subtotal - discount;
}
