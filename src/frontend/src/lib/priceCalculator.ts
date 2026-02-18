// Price calculation utility for vehicle approximate cost
// Formula: (priceInYuan × yuanRate) + 2.5% commission + delivery + selectionService + epTs + customsDuty

interface CostSettings {
  yuanRate: number;
  euroRate?: number;
  deliveryCost: number;
  selectionServiceCost: number;
  epTsCost: number;
}

export interface PriceBreakdown {
  carPrice: number;
  customsDuty: number;
  delivery: number;
  epTs: number;
  bankCommission: number;
  selectionService: number;
  total: number;
}

// Calculate customs duty based on engine volume and cost brackets
// Formula: Duty = (engineVolume × tariffEuroPerCm³ × euroRate) + customsFee
function calculateCustomsDuty(engineVolume: number, costInRub: number, euroRate: number): number {
  // Determine tariff based on engine volume (€/cm³)
  let tariffEuroPerCm3: number;
  
  if (engineVolume <= 1000) {
    tariffEuroPerCm3 = 1.5;
  } else if (engineVolume <= 1500) {
    tariffEuroPerCm3 = 1.7;
  } else if (engineVolume <= 1800) {
    tariffEuroPerCm3 = 2.5;
  } else if (engineVolume <= 2300) {
    tariffEuroPerCm3 = 2.7;
  } else if (engineVolume <= 3000) {
    tariffEuroPerCm3 = 3.0;
  } else {
    tariffEuroPerCm3 = 3.6;
  }

  // Determine customs fee based on vehicle cost in rubles
  let customsFee: number;
  
  if (costInRub <= 1200000) {
    customsFee = 4924;
  } else if (costInRub <= 2700000) {
    customsFee = 13541;
  } else {
    customsFee = 18465;
  }

  // Calculate duty: (engineVolume × tariff × euroRate) + customsFee
  const duty = (engineVolume * tariffEuroPerCm3 * euroRate) + customsFee;

  return duty;
}

export function calculateApproxCost(
  priceInYuan: number,
  engineVolume: number,
  settings: CostSettings
): number {
  const { yuanRate, euroRate = 100, deliveryCost, selectionServiceCost, epTsCost } = settings;

  // Convert yuan to rubles
  const basePrice = priceInYuan * yuanRate;

  // Calculate 2.5% commission
  const commission = basePrice * 0.025;

  // Calculate customs duty using corrected formula
  const customsDuty = calculateCustomsDuty(engineVolume, basePrice, euroRate);

  // Total approximate cost
  const total = basePrice + commission + deliveryCost + selectionServiceCost + epTsCost + customsDuty;

  return Math.round(total);
}

export function calculatePriceBreakdown(
  priceInYuan: number,
  engineVolume: number,
  settings: CostSettings
): PriceBreakdown {
  const { yuanRate, euroRate = 100, deliveryCost, selectionServiceCost, epTsCost } = settings;

  // Convert yuan to rubles (car price)
  const carPrice = priceInYuan * yuanRate;

  // Calculate 2.5% bank commission
  const bankCommission = carPrice * 0.025;

  // Calculate customs duty using corrected formula
  const customsDuty = calculateCustomsDuty(engineVolume, carPrice, euroRate);

  // Total approximate cost
  const total = carPrice + bankCommission + deliveryCost + selectionServiceCost + epTsCost + customsDuty;

  return {
    carPrice: Math.round(carPrice),
    customsDuty: Math.round(customsDuty),
    delivery: Math.round(deliveryCost),
    epTs: Math.round(epTsCost),
    bankCommission: Math.round(bankCommission),
    selectionService: Math.round(selectionServiceCost),
    total: Math.round(total),
  };
}

export function formatPrice(price: number | bigint): string {
  return new Intl.NumberFormat('ru-RU').format(Number(price));
}
