"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Offer, Product, Ladder, Continuity } from "./schema";
import { seed, newLadder, newProduct, cloneProduct, newContinuity } from "./seed";
import { migrateOffer } from "./migrate";

// When a field is improved with "✨ Enhance with AI", we keep BOTH the text the
// user originally wrote and the AI rewrite, keyed by `${productId}.${field}`.
// This lets the Brand DNA account tab show the original alongside its AI version.
export type Enhancement = { original: string; enhanced: string };
export type EnhancementMap = Record<string, Enhancement>;

interface OfferDraftStore {
  offer: Offer;
  enhancements: EnhancementMap;

  // Navigation. `curProduct === null` means the ladder "home" view is showing;
  // a number means we're editing that product. `current` is the step within
  // the product builder.
  curLadder: number;
  curProduct: number | null;
  current: number;

  setOffer: (offer: Offer) => void;
  patch: (updates: Partial<Offer>) => void;
  setOfferName: (name: string) => void;

  updateLadder: (li: number, updates: Partial<Ladder>) => void;
  addLadder: () => void;
  removeLadder: (li: number) => void;

  updateProduct: (li: number, pi: number, updates: Partial<Product>) => void;
  patchProduct: (updates: Partial<Product>) => void;
  setProductField: <K extends keyof Product>(key: K, value: Product[K]) => void;
  addProduct: (li: number) => void;
  duplicateProduct: (li: number, pi: number) => void;
  removeProduct: (li: number, pi: number) => void;

  addContinuity: (li: number) => void;
  updateContinuity: (li: number, ci: number, updates: Partial<Continuity>) => void;
  removeContinuity: (li: number, ci: number) => void;

  recordEnhancement: (key: string, original: string, enhanced: string) => void;
  setEnhancements: (e: EnhancementMap) => void;

  setCurLadder: (n: number) => void;
  setCurProduct: (n: number | null) => void;
  setCurrent: (n: number) => void;
  reset: () => void;
}

const mapLadder = (
  offer: Offer,
  li: number,
  fn: (l: Ladder) => Ladder,
): Offer => ({
  ...offer,
  ladders: offer.ladders.map((l, i) => (i === li ? fn(l) : l)),
});

export const useOfferDraftStore = create<OfferDraftStore>()(
  persist(
    (set) => ({
      offer: seed(),
      enhancements: {},
      curLadder: 0,
      curProduct: null,
      current: 0,

      setOffer: (offer) => set({ offer }),
      patch: (updates) => set((s) => ({ offer: { ...s.offer, ...updates } })),
      setOfferName: (offerName) =>
        set((s) => ({ offer: { ...s.offer, offerName } })),

      updateLadder: (li, updates) =>
        set((s) => ({
          offer: mapLadder(s.offer, li, (l) => ({ ...l, ...updates })),
        })),

      addLadder: () =>
        set((s) => ({
          offer: { ...s.offer, ladders: [...s.offer.ladders, newLadder()] },
          curLadder: s.offer.ladders.length,
          curProduct: null,
        })),

      removeLadder: (li) =>
        set((s) => {
          if (s.offer.ladders.length <= 1) return s;
          const ladders = s.offer.ladders.filter((_, i) => i !== li);
          return {
            offer: { ...s.offer, ladders },
            curLadder: Math.min(s.curLadder, ladders.length - 1),
            curProduct: null,
          };
        }),

      updateProduct: (li, pi, updates) =>
        set((s) => ({
          offer: mapLadder(s.offer, li, (l) => ({
            ...l,
            products: l.products.map((p, i) =>
              i === pi ? { ...p, ...updates } : p,
            ),
          })),
        })),

      patchProduct: (updates) =>
        set((s) => {
          if (s.curProduct === null) return s;
          return {
            offer: mapLadder(s.offer, s.curLadder, (l) => ({
              ...l,
              products: l.products.map((p, i) =>
                i === s.curProduct ? { ...p, ...updates } : p,
              ),
            })),
          };
        }),

      setProductField: (key, value) =>
        set((s) => {
          if (s.curProduct === null) return s;
          return {
            offer: mapLadder(s.offer, s.curLadder, (l) => ({
              ...l,
              products: l.products.map((p, i) =>
                i === s.curProduct ? { ...p, [key]: value } : p,
              ),
            })),
          };
        }),

      addProduct: (li) =>
        set((s) => {
          const l = s.offer.ladders[li];
          const last = l.products[l.products.length - 1];
          // Clone the flagship (or last) product so a new product starts from a
          // real, filled-in offer the user then edits up/down.
          const flagship = l.products.find((p) => p.pop) ?? last;
          const next = flagship ? cloneProduct(flagship, { name: "" }) : newProduct();
          // Stay on the ladder home — the new product just appears as a step;
          // the user opens it to edit only when they click "Build offer".
          return {
            offer: mapLadder(s.offer, li, (lad) => ({
              ...lad,
              products: [...lad.products, next],
            })),
            curLadder: li,
            curProduct: null,
          };
        }),

      duplicateProduct: (li, pi) =>
        set((s) => {
          const src = s.offer.ladders[li].products[pi];
          if (!src) return s;
          const copy = cloneProduct(src, {
            name: src.name ? `${src.name} (copy)` : "",
          });
          const products = [...s.offer.ladders[li].products];
          products.splice(pi + 1, 0, copy);
          return {
            offer: mapLadder(s.offer, li, (lad) => ({ ...lad, products })),
            curLadder: li,
            curProduct: pi + 1,
            current: 0,
          };
        }),

      removeProduct: (li, pi) =>
        set((s) => {
          let products = s.offer.ladders[li].products.filter((_, i) => i !== pi);
          if (products.length === 0) products = [newProduct()];
          return {
            offer: mapLadder(s.offer, li, (lad) => ({ ...lad, products })),
            curProduct: null,
          };
        }),

      addContinuity: (li) =>
        set((s) => ({
          offer: mapLadder(s.offer, li, (lad) => ({
            ...lad,
            continuities: [...lad.continuities, newContinuity()],
          })),
        })),

      updateContinuity: (li, ci, updates) =>
        set((s) => ({
          offer: mapLadder(s.offer, li, (lad) => ({
            ...lad,
            continuities: lad.continuities.map((c, i) =>
              i === ci ? { ...c, ...updates } : c,
            ),
          })),
        })),

      removeContinuity: (li, ci) =>
        set((s) => ({
          offer: mapLadder(s.offer, li, (lad) => ({
            ...lad,
            continuities: lad.continuities.filter((_, i) => i !== ci),
          })),
        })),

      recordEnhancement: (key, original, enhanced) =>
        set((s) => ({
          enhancements: {
            ...s.enhancements,
            [key]: { original: s.enhancements[key]?.original ?? original, enhanced },
          },
        })),
      setEnhancements: (enhancements) => set({ enhancements }),

      setCurLadder: (curLadder) => set({ curLadder, curProduct: null, current: 0 }),
      setCurProduct: (curProduct) => set({ curProduct, current: 0 }),
      setCurrent: (current) => set({ current }),

      reset: () =>
        set({
          offer: seed(),
          enhancements: {},
          curLadder: 0,
          curProduct: null,
          current: 0,
        }),
    }),
    {
      name: "copyking-offer-draft",
      version: 2,
      partialize: (s) => ({ offer: s.offer, enhancements: s.enhancements }),
      migrate: (persisted) => {
        const p = (persisted ?? {}) as {
          offer?: unknown;
          enhancements?: EnhancementMap;
        };
        return {
          offer: migrateOffer(p.offer),
          enhancements: p.enhancements ?? {},
        };
      },
    },
  ),
);
