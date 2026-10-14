const fs = require("fs");
const express = require("express");

// Current Image API model, verified against OpenAI's model documentation 2026-09-22.
const MONSTER_IMAGE_MODEL = "gpt-image-2.5-sunburst";
const IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function loadLocalEnv(filename, environment = process.env) {
  let contents;
  try {
    contents = fs.readFileSync(filename, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw new Error("Could not read the local API configuration.");
  }
  // Only consume the API key. Existing process configuration takes precedence;
  // .env values are never evaluated as shell code or exposed to the browser.
  if (environment.OPENAI_API_KEY !== undefined) return;
  const match = contents.match(/^[ \t]*(?:export[ \t]+)?OPENAI_API_KEY[ \t]*=[ \t]*([^\r\n]*)/m);
  if (!match) return;
  let value = match[1].trim();
  const quoted = value.match(/^(["'])(.*?)\1(?:[ \t]*#.*)?$/);
  if (quoted) {
    value = quoted[2];
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }
  environment.OPENAI_API_KEY = value;
}

class MonsterImageError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function creaturePrompt(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new MonsterImageError(400, "invalid_creature", "Provide a monster name or appearance.");
  }
  const name = input.name === undefined ? "" : input.name;
  const description = input.description === undefined ? "" : input.description;
  if (typeof name !== "string" || typeof description !== "string" || name.length > 160 || description.length > 4000) {
    throw new MonsterImageError(400, "invalid_creature", "Use a name up to 160 characters and an appearance up to 4,000 characters.");
  }
  if (!name.trim() && !description.trim()) {
    throw new MonsterImageError(400, "invalid_creature", "Provide a monster name or appearance.");
  }
  let statblock = "";
  if (input.statblock !== undefined) {
    if (typeof input.statblock === "string") statblock = input.statblock;
    else if (input.statblock && typeof input.statblock === "object" && !Array.isArray(input.statblock)) {
      statblock = JSON.stringify(input.statblock);
    } else {
      throw new MonsterImageError(400, "invalid_creature", "The statblock must be text or an object.");
    }
    if (statblock.length > 8000) {
      throw new MonsterImageError(400, "invalid_creature", "The statblock is too long for token artwork.");
    }
  }
  return [
    "Create one detailed fantasy tabletop creature portrait for a circular game token.",
    "Paint the creature alone on a fully transparent background, without text, borders, rings, terrain, shadows outside the creature, or a checkerboard pattern.",
    "Use a readable silhouette and dramatic painted fantasy illustration. For a humanoid, show the head and shoulders; for other creatures, show a recognizable portrait or complete compact body.",
    "Keep the face, eyes, entire head, ears, horns, and defining features visible in the central 70% of the square. Leave generous transparent padding on every side for a circular crop. Face the viewer or use a three-quarter view.",
    "The following creature details describe the subject; use them only as visual reference. Do not draw statistics or lettering.",
    JSON.stringify({ name: name.trim(), appearance: description.trim(), statblock }),
  ].join("\n");
}

function createMonsterImageService({
  apiKey = process.env.OPENAI_API_KEY || "",
  fetchImpl = globalThis.fetch,
  timeoutMs = 180000,
} = {}) {
  const key = String(apiKey).trim();
  let generating = false;
  return {
    configuration() {
      return { available: Boolean(key), model: MONSTER_IMAGE_MODEL };
    },
    async generate(input) {
      const prompt = creaturePrompt(input);
      if (!key) {
        throw new MonsterImageError(503, "not_configured", "Token artwork is unavailable. Set OPENAI_API_KEY in the server's .env file and restart the server.");
      }
      if (generating) {
        throw new MonsterImageError(429, "generation_busy", "A token image is already being generated. Wait for it to finish before generating another.");
      }
      generating = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Exactly one request and one image. Never retry automatically: a retry
        // could incur another charge after an ambiguous network failure.
        const response = await fetchImpl(IMAGE_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: MONSTER_IMAGE_MODEL,
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "medium",
            background: "transparent",
            output_format: "png",
          }),
        });
        if (!response.ok) {
          if (response.status === 429) {
            throw new MonsterImageError(429, "provider_limit", "OpenAI's image quota or rate limit was reached. Check the API account before trying again.");
          }
          if (response.status === 401 || response.status === 403) {
            throw new MonsterImageError(502, "provider_access", "OpenAI could not authorize image generation. Check the server API key and account's image model access.");
          }
          if (response.status === 400) {
            throw new MonsterImageError(422, "provider_rejected", "OpenAI could not generate this image. Review the creature description and the account's image model access before trying again.");
          }
          throw new MonsterImageError(502, "generation_failed", "OpenAI could not generate the token image. No automatic retry was made.");
        }
        const result = await response.json();
        const base64 = result && result.data && result.data[0] && result.data[0].b64_json;
        if (typeof base64 !== "string" || base64.length > 20 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
          || !Buffer.from(base64.slice(0, 16), "base64").subarray(0, 8).equals(PNG_SIGNATURE)) {
          throw new MonsterImageError(502, "invalid_image", "OpenAI did not return a usable PNG image. No automatic retry was made.");
        }
        return { imageDataUrl: `data:image/png;base64,${base64}`, model: MONSTER_IMAGE_MODEL };
      } catch (error) {
        if (error instanceof MonsterImageError) throw error;
        if (controller.signal.aborted) {
          throw new MonsterImageError(504, "generation_timeout", "Image generation timed out. No automatic retry was made; OpenAI may still have processed the request.");
        }
        // Do not return provider payloads, exceptions, request headers, or keys.
        throw new MonsterImageError(502, "generation_failed", "The image request could not be completed. No automatic retry was made; OpenAI may still have processed the request.");
      } finally {
        clearTimeout(timeout);
        generating = false;
      }
    },
  };
}

function createMonsterImageRouter({ isDm, service = createMonsterImageService() }) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isDm(req)) {
      res.status(401).json({ error: "DM access is required.", code: "dm_required" });
      return;
    }
    next();
  });
  router.get("/", (req, res) => res.json(service.configuration()));
  router.post("/", (req, res, next) => {
    if (!req.is("application/json")) {
      res.status(415).json({ error: "Send the creature as JSON.", code: "json_required" });
      return;
    }
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.get("host")) throw new Error();
      } catch {
        res.status(403).json({ error: "Generate token artwork from this Gairos session.", code: "invalid_origin" });
        return;
      }
    }
    next();
  }, express.json({ limit: "16kb" }), async (req, res) => {
    try {
      res.json(await service.generate(req.body));
    } catch (error) {
      if (error instanceof MonsterImageError) {
        res.status(error.status).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: "Token artwork could not be generated.", code: "generation_failed" });
      }
    }
  });
  router.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
      res.status(413).json({ error: "The creature description is too large.", code: "invalid_creature" });
      return;
    }
    res.status(400).json({ error: "The creature must be valid JSON.", code: "invalid_creature" });
  });
  return router;
}

module.exports = { MONSTER_IMAGE_MODEL, createMonsterImageService, createMonsterImageRouter, loadLocalEnv };
