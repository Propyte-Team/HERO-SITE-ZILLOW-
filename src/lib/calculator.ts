// ── Rent bounds (hard filter) ──
export const RENT_BOUNDS = { MIN: 5_000, MAX: 500_000 } as const;

// ── Closing costs (escrituración) by state ──
export const CLOSING_COSTS_BY_STATE: Record<string, number> = {
  'Quintana Roo': 0.08,
  'Yucatan': 0.06,
};

export function getClosingCostRate(state: string): number {
  return CLOSING_COSTS_BY_STATE[state] ?? 0.06;
}

export function calculateClosingCosts(price: number, state: string): number {
  return Math.round(price * getClosingCostRate(state));
}

export function calculateTotalInvestment(price: number, state: string): number {
  return price + calculateClosingCosts(price, state);
}

// ── Financial calculators ──

export function calculateMonthlyPayment(
  price: number,
  downPaymentPct: number,
  months: number,
  annualRate: number
): number {
  const principal = price * (1 - downPaymentPct / 100);
  if (months === 0) return 0;
  if (annualRate === 0) return principal / months;

  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

export function calculateROI(
  price: number,
  downPaymentPct: number,
  annualRent: number,
  appreciation: number,
  years: number
): number {
  const totalInvested = price * (downPaymentPct / 100);
  const totalRentalIncome = annualRent * years;
  const appreciationValue = price * Math.pow(1 + appreciation / 100, years) - price;
  const totalReturn = totalRentalIncome + appreciationValue;
  return (totalReturn / totalInvested) * 100;
}

export function calculateCashOnCash(annualRent: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return (annualRent / totalInvested) * 100;
}

export function calculateBreakeven(totalInvested: number, monthlyNetFlow: number): number {
  if (monthlyNetFlow <= 0) return Infinity;
  return Math.ceil(totalInvested / monthlyNetFlow);
}

export function calculateProjectedValue(
  price: number,
  appreciation: number,
  years: number
): number {
  return Math.round(price * Math.pow(1 + appreciation / 100, years));
}

export function calculateCapRate(annualNetRent: number, price: number): number {
  if (price === 0) return 0;
  return (annualNetRent / price) * 100;
}

export function calculateGrossYield(annualRent: number, price: number): number {
  if (price === 0) return 0;
  return (annualRent / price) * 100;
}

export function calculateNetYield(
  annualRent: number,
  price: number,
  expenseRatio: number = 0.25
): number {
  if (price === 0) return 0;
  return (annualRent * (1 - expenseRatio) / price) * 100;
}

/**
 * Calculate Internal Rate of Return using Newton-Raphson method.
 * cashFlows: array of annual cash flows (negative initial investment, positive returns).
 * Returns annual IRR as percentage, or null if doesn't converge.
 */
export function calculateIRR(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;

  let rate = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }

    if (Math.abs(dnpv) < 1e-12) break;

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100;
    }
    rate = newRate;

    // Guard against divergence
    if (rate < -0.99 || rate > 10) return null;
  }

  return null;
}
