import type { Offer as BrandOffer } from "@/types/brand";
import type { Offer as BuilderOffer, Product } from "./schema";
import { stageValue, money } from "./schema";

// The "flagship" product is the one marked ⭐ most-popular, else the first rung
// of the first ladder. It's what we sync with the Brand DNA `offer` pillar.
export function flagshipProduct(offer: BuilderOffer): Product | null {
  for (const L of offer.ladders) {
    const star = L.products.find((p) => p.pop);
    if (star) return star;
  }
  return offer.ladders[0]?.products[0] ?? null;
}

// Seed a fresh flagship product from the saved Brand DNA `offer` pillar.
export function brandToProduct(brand: BrandOffer): Partial<Product> {
  const seed: Partial<Product> = {};
  if (brand.dreamOutcome) seed.dream = brand.dreamOutcome;
  if (brand.grandSlamDescription) seed.trim = brand.grandSlamDescription;
  if (brand.pricePoint) {
    const num = brand.pricePoint.replace(/[^0-9.]/g, "");
    if (num) seed.realPrice = num;
  }
  return seed;
}

// Write the flagship product back into the Brand DNA `offer` pillar.
export function offerToBrand(offer: BuilderOffer): Partial<BrandOffer> {
  const p = flagshipProduct(offer);
  if (!p) return {};
  const total = stageValue(p);
  return {
    dreamOutcome: p.dream,
    pricePoint: p.realPrice ? money(p.realPrice) : p.price || "",
    grandSlamDescription: p.trim,
    perceivedLikelihood: p.guaranteeResult,
    timeDelay: p.guaranteeWindow,
    ...(total ? { deliveryModel: `Stacked value ${money(total)}` } : {}),
  };
}
