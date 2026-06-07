"use client";

import { useOfferDraftStore } from "@/lib/offer/store";
import { ValueLadder } from "./value-ladder";
import { ProductBuilder } from "./product-builder";

// The value ladder is the spine. When no product is selected we show the ladder
// "home" (the canvas of rungs); selecting a rung opens its full offer builder.
export function OfferBuilderShell() {
  const curProduct = useOfferDraftStore((s) => s.curProduct);
  return curProduct === null ? <ValueLadder /> : <ProductBuilder />;
}
