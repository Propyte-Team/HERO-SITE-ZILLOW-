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
