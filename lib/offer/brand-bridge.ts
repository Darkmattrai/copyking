import type { Offer as BrandOffer } from "@/types/brand";
import type { Offer as BuilderOffer } from "./schema";
import { offerValueTotal, money } from "./schema";

// Seed the Offer Builder from the saved Brand DNA `offer` pillar.
export function brandToOffer(brand: BrandOffer): Partial<BuilderOffer> {
  const seed: Partial<BuilderOffer> = {};
  if (brand.dreamOutcome) seed.dream = brand.dreamOutcome;
  if (brand.grandSlamDescription) seed.trim = brand.grandSlamDescription;
  if (brand.pricePoint) {
    const num = brand.pricePoint.replace(/[^0-9.]/g, "");
    if (num) seed.realPrice = num;
  }
  return seed;
}

// Write the finished offer back into the Brand DNA `offer` pillar.
export function offerToBrand(offer: BuilderOffer): Partial<BrandOffer> {
  const total = offerValueTotal(offer);
  return {
    dreamOutcome: offer.dream,
    pricePoint: offer.realPrice ? money(offer.realPrice) : "",
    grandSlamDescription: offer.trim,
    perceivedLikelihood: offer.guaranteeResult,
    timeDelay: offer.guaranteeWindow,
    ...(total ? { deliveryModel: `Stacked value ${money(total)}` } : {}),
  };
}
