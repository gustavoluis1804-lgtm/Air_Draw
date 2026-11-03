export type GeometryMode = "inflate" | "lathe" | "extrude" | "tubes";

export type MaterialVariant =
  | "neon"
  | "chrome"
  | "glass"
  | "gold"
  | "clay"
  | "crystal"
  | "hologram"
  | "obsidian"
  | "ruby";

export type GeminiSpec = {
  mode: GeometryMode;
  material: MaterialVariant;
  depth: number;
  inflation: number;
  doubleSided: boolean;
  particles: boolean;
  pedestal: boolean;
  autoRotate: boolean;
  rotationX: number;
  rotationY: number;
  lighting: string;
  detectedObject: string;
  description: string;
};

export type StrokeAnalysis = {
  pointsCount: number;
  strokeCount: number;
  aspect: number;
  isSymmetric?: boolean;
  isClosed?: boolean;
};

const GEMINI_KEY_STORAGE = "airdraw:gemini:key:v1";

export function loadGeminiKey(): string {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(GEMINI_KEY_STORAGE);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch {
    // ignore
  }
  try {
    const envKey = (import.meta as unknown as { env?: Record<string, string> })
      .env?.VITE_GEMINI_API_KEY;
    if (typeof envKey === "string" && envKey.trim()) return envKey.trim();
  } catch {
    // env not available
  }
  return "";
}

export function saveGeminiKey(key: string) {
  try {
    if (typeof localStorage === "undefined") return;
    if (!key.trim()) {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      return;
    }
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

/** Official Google AI Studio Gemini models in fallback order. */
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-lite",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const VALID_MODES: Set<GeometryMode> = new Set([
  "inflate",
  "lathe",
  "extrude",
  "tubes",
]);
const VALID_MATERIALS: Set<MaterialVariant> = new Set([
  "neon",
  "chrome",
  "glass",
  "gold",
  "clay",
  "crystal",
  "hologram",
  "obsidian",
  "ruby",
]);

export function normalizeGeminiSpec(
  partial: Partial<GeminiSpec> | null | undefined,
): GeminiSpec {
  const mode =
    partial?.mode && VALID_MODES.has(partial.mode) ? partial.mode : "inflate";
  const material =
    partial?.material && VALID_MATERIALS.has(partial.material)
      ? partial.material
      : "neon";

  return {
    mode,
    material,
    depth: clamp(Number(partial?.depth ?? 1.4), 0.5, 3.5),
    inflation: clamp(Number(partial?.inflation ?? 1.2), 0.5, 2.5),
    doubleSided: partial?.doubleSided !== false,
    particles: partial?.particles !== false,
    pedestal: partial?.pedestal !== false,
    autoRotate: Boolean(partial?.autoRotate ?? true),
    rotationX: clamp(Number(partial?.rotationX ?? 12), -45, 45),
    rotationY: clamp(Number(partial?.rotationY ?? -18), -45, 45),
    lighting: String(
      partial?.lighting ?? "iluminação de estúdio com reflexos realistas",
    ),
    detectedObject: String(partial?.detectedObject ?? "Objeto 3D Gerado"),
    description: String(partial?.description ?? "Modelo 3D aprimorado com IA"),
  };
}

export function buildFallbackGeminiSpec(
  prompt: string,
  strokeCount: number,
  analysis?: StrokeAnalysis,
): GeminiSpec {
  const text = (prompt || "").trim().toLowerCase();

  // Mode detection keywords
  const isLathe =
    /\b(copo|taca|taça|vaso|garrafa|jarra|xicara|xícara|garfo|vela|lampada|lâmpada|foguete|trofeu|troféu|anel|chalice|cup|vase|bottle|glass|wine|mug|lathe|torno|revolucao|revolução|cilindro|pot|pote|bowl|tigela|esfera|globo)\b/i.test(
      text,
    ) || Boolean(analysis?.isSymmetric && (analysis?.aspect ?? 1) < 1.2);

  const isExtrude =
    /\b(cubo|caixa|predio|prédio|carro|espada|escudo|letra|logo|bloco|extrusao|extrusão|box|car|sword|shield|building|text|brick|quadrado|retangulo|triangulo|triângulo|placa)\b/i.test(
      text,
    );

  const isTubes =
    /\b(fio|linha|circuito|raio|relampago|relâmpago|cabo|traco|traço|tubo|tubos|pipes|wire|abstract)\b/i.test(
      text,
    );

  const mode: GeometryMode = isLathe
    ? "lathe"
    : isExtrude
      ? "extrude"
      : isTubes
        ? "tubes"
        : "inflate";

  // Material detection keywords
  const isGold =
    /\b(ouro|gold|dourad[oa]|joia|joalheria|wealth|luxury|luxo|award|premio|prêmio)\b/i.test(
      text,
    );
  const isCrystal =
    /\b(cristal|crystal|diamante|diamond|prisma|facetad[oa])\b/i.test(text);
  const isGlass =
    /\b(vidro|glass|transparente|ice|gelo|translucid[oa]|liquido|líquido)\b/i.test(
      text,
    );
  const isChrome =
    /\b(cromo|chrome|metal|prata|silver|aco|aço|espelho|refletiv[oa]|steel)\b/i.test(
      text,
    );
  const isClay =
    /\b(argila|clay|barro|ceramica|cerâmica|terra|escultura|artesanal|stone|pedra|organico|orgânico)\b/i.test(
      text,
    );
  const isHologram =
    /\b(holograma|hologram|scifi|sci-fi|cyber|matrix|virtual|laser)\b/i.test(
      text,
    );
  const isRuby =
    /\b(rubi|ruby|vermelho|sangue|preciosa|gem|joia|esmeralda)\b/i.test(text);
  const isObsidian = /\b(obsidiana|obsidian|preto|negro|dark|black)\b/i.test(
    text,
  );
  const isNeon =
    /\b(neon|luz|brilho|glow|plasma|eletric[oa]|synthwave|cyberpunk|future|futuristic|futurista)\b/i.test(
      text,
    );

  const material: MaterialVariant = isGold
    ? "gold"
    : isCrystal
      ? "crystal"
      : isGlass
        ? "glass"
        : isChrome
          ? "chrome"
          : isClay
            ? "clay"
            : isHologram
              ? "hologram"
              : isRuby
                ? "ruby"
                : isObsidian
                  ? "obsidian"
                  : isNeon
                    ? "neon"
                    : isLathe
                      ? "glass"
                      : strokeCount > 8
                        ? "chrome"
                        : "neon";

  // Dynamic depth and rotation
  const depth = clamp(
    1.2 +
      (mode === "lathe" ? 0.6 : mode === "extrude" ? 0.5 : 0.3) +
      (isGlass ? 0.3 : 0),
    0.8,
    3.0,
  );
  const inflation = mode === "inflate" ? 1.4 : 1.0;
  const rotationX = isGold ? 16 : isGlass ? 10 : 14;
  const rotationY = isNeon ? -22 : -16;

  let detectedObject = "Criação 3D AirDraw";
  if (isLathe)
    detectedObject = isGlass ? "Taça / Vaso de Cristal" : "Objeto em Torno 3D";
  else if (isGold) detectedObject = "Escultura em Ouro Maciço";
  else if (isExtrude) detectedObject = "Estrutura Geométrica 3D";
  else if (text) detectedObject = `Modelo 3D (${prompt.slice(0, 24)})`;

  return {
    mode,
    material,
    depth,
    inflation,
    doubleSided: true,
    particles: true,
    pedestal: true,
    autoRotate: true,
    rotationX,
    rotationY,
    lighting:
      material === "neon"
        ? "neon cyber com reflexos nas bordas"
        : material === "glass" || material === "crystal"
          ? "estúdio suave com refrações translúcidas"
          : material === "gold" || material === "chrome"
            ? "estúdio metálico com destaques brilhantes"
            : "iluminação tridimensional de estúdio",
    detectedObject,
    description: `Geração inteligente: modo ${mode} + material ${material}`,
  };
}

function extractJsonObject(raw: unknown): Partial<GeminiSpec> | null {
  if (!raw) return null;

  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as Partial<GeminiSpec>;
    } catch {
      // fall through
    }
  }

  try {
    return JSON.parse(cleaned) as Partial<GeminiSpec>;
  } catch {
    return null;
  }
}

export async function enhance3DWithGemini(
  prompt: string,
  strokeCount: number,
  imageBase64?: string | null,
  analysis?: StrokeAnalysis,
): Promise<GeminiSpec> {
  const key = loadGeminiKey();

  if (!key.trim()) {
    return buildFallbackGeminiSpec(prompt, strokeCount, analysis);
  }

  const promptText =
    prompt.trim() ||
    "analise este traço e transforme em um objeto 3D incrível e realista";
  const userText = `Você é um motor de IA gerador de 3D para o AirDraw.
Analise o desenho do usuário ${imageBase64 ? "(imagem fornecida)" : ""} e configure a geração 3D ideal.
Retorne SOMENTE JSON PURO (sem markdown), exatamente neste formato:
{
  "detectedObject": "Nome do que você identificou em Português (ex.: Taça de Vinho, Coração 3D, Carro, Espada, etc.)",
  "mode": "inflate" | "lathe" | "extrude" | "tubes",
  "material": "neon" | "chrome" | "glass" | "gold" | "clay" | "crystal" | "hologram" | "obsidian" | "ruby",
  "depth": número entre 0.8 e 3.0,
  "inflation": número entre 0.8 e 2.2,
  "doubleSided": true,
  "particles": true,
  "pedestal": true,
  "autoRotate": true,
  "rotationX": número entre -30 e 30,
  "rotationY": número entre -30 e 30,
  "lighting": "descrição da iluminação em português",
  "description": "resumo de uma frase em português"
}

Guia de "mode":
- "lathe": escolha se o objeto for copo, taça, vaso, garrafa, anel, sino, bola, troféu ou qualquer objeto de revolução radial.
- "inflate": escolha para corações, flores, animais, rostos, nuvens, personagens ou formas orgânicas com volume e relevo.
- "extrude": escolha para objetos sólidos, espadas, logos, prédios, letras ou mecânicos.
- "tubes": escolha para circuitos, linhas livres ou raios.

Prompt do usuário: "${promptText}". Traços desenhados: ${strokeCount}.`;

  const parts: Array<Record<string, unknown>> = [{ text: userText }];

  if (imageBase64) {
    const dataOnly = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    if (dataOnly.length > 50) {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: dataOnly,
        },
      });
    }
  }

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      const text = await response.text();
      if (!response.ok) {
        let message = text || "gemini-failed";
        try {
          const payload = JSON.parse(text);
          message = payload?.error?.message || message;
        } catch {
          // ignore
        }

        const lower = message.toLowerCase();
        if (
          lower.includes("not found") ||
          lower.includes("404") ||
          lower.includes("unsupported")
        ) {
          // Try next model in list
          continue;
        }

        // If quota / forbidden / unauthorized, fall back to smart local spec
        return buildFallbackGeminiSpec(prompt, strokeCount, analysis);
      }

      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return buildFallbackGeminiSpec(prompt, strokeCount, analysis);
      }

      const rawText =
        payload?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part?.text ?? "")
          .join("") ?? "{}";

      const extracted = extractJsonObject(rawText);
      if (extracted) {
        return normalizeGeminiSpec(extracted);
      }
    } catch {
      // Network error or fetch fail, try next model or fallback
      continue;
    }
  }

  return buildFallbackGeminiSpec(prompt, strokeCount, analysis);
}
