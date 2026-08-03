import path from "node:path";

const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bsk-ant-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{30,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi,
  /(api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*[:=]\s*["']?[^\s,"']{8,}/gi
];

const SENSITIVE_FILE_PATTERNS = [
  /^\.env(?:\..*)?$/i,
  /(^|\/)\.env(?:\..*)?$/i,
  /(^|\/)(secrets?|credentials?)(\/|$)/i,
  /(^|\/)id_(rsa|ed25519)(\.pub)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)service[-_]?account.*\.json$/i,
  /(^|\/).*\.(pem|p12|pfx|key)$/i
];

export function redactText(value) {
  let text = String(value ?? "");
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (match, label) => label ? `${label}=[REDACTED]` : "[REDACTED]");
  }
  return text;
}

export function redactObject(value) {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redactObject);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (["standingAuthorization", "standing_authorization"].includes(key)) output[key] = redactObject(child);
      else if (/secret|token|password|api.?key|authorization/i.test(key)) output[key] = "[REDACTED]";
      else output[key] = redactObject(child);
    }
    return output;
  }
  return value;
}

export function isSensitivePath(filePath) {
  const normalized = String(filePath ?? "").split(path.sep).join("/").replace(/^\.\//, "");
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}
