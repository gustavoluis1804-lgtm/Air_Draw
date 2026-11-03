import { describe, expect, it } from "vitest";

import {
  buildFallbackGeminiSpec,
  enhance3DWithGemini,
  loadGeminiKey,
  normalizeGeminiSpec,
  saveGeminiKey,
} from "./gemini";

describe("Gemini 3D Generation & Spec normalizer", () => {
  it("normalizes invalid or missing spec fields with safe defaults", () => {
    const spec = normalizeGeminiSpec(null);
    expect(spec.mode).toBe("inflate");
    expect(spec.material).toBe("neon");
    expect(spec.depth).toBeGreaterThanOrEqual(0.5);
    expect(spec.depth).toBeLessThanOrEqual(3.5);
    expect(spec.doubleSided).toBe(true);
    expect(spec.particles).toBe(true);
    expect(spec.pedestal).toBe(true);
  });

  it("detects lathe mode for cup, vase or chalice prompts", () => {
    const specVase = buildFallbackGeminiSpec("taça de vinho elegante", 4);
    expect(specVase.mode).toBe("lathe");
    expect(specVase.material).toBe("glass");

    const specCup = buildFallbackGeminiSpec("vaso de cerâmica", 2);
    expect(specCup.mode).toBe("lathe");
    expect(specCup.material).toBe("clay");
  });

  it("detects inflate mode for organic shapes like hearts and flowers", () => {
    const specHeart = buildFallbackGeminiSpec("coração vermelho 3d", 3);
    expect(specHeart.mode).toBe("inflate");
    expect(specHeart.inflation).toBeGreaterThan(1);
  });

  it("detects gold, crystal, chrome, and hologram materials", () => {
    const gold = buildFallbackGeminiSpec("troféu de ouro maciço", 5);
    expect(gold.material).toBe("gold");

    const crystal = buildFallbackGeminiSpec("diamante de cristal brilhante", 4);
    expect(crystal.material).toBe("crystal");

    const chrome = buildFallbackGeminiSpec("escultura de metal cromo", 8);
    expect(chrome.material).toBe("chrome");

    const holo = buildFallbackGeminiSpec("holograma futurista sci-fi", 2);
    expect(holo.material).toBe("hologram");
  });

  it("detects solid extrusion for geometric objects like cubes or swords", () => {
    const sword = buildFallbackGeminiSpec("espada medieval", 3);
    expect(sword.mode).toBe("extrude");
  });

  it("saves and loads the Gemini API key in localStorage", () => {
    saveGeminiKey("AIzaSyTestKey123");
    expect(loadGeminiKey()).toBe("AIzaSyTestKey123");
    saveGeminiKey("");
    expect(loadGeminiKey()).toBe("");
  });

  it("returns a complete fallback spec when key is empty without failing", async () => {
    saveGeminiKey("");
    const spec = await enhance3DWithGemini("garrafa de vinho", 2);
    expect(spec).toBeDefined();
    expect(spec.mode).toBe("lathe");
    expect(spec.material).toBe("glass");
  });
});
