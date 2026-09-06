import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateKeyString() {
  const groups = [];
  for (let g = 0; g < 4; g++) {
    let part = "";
    for (let i = 0; i < 4; i++) {
      part += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
    }
    groups.push(part);
  }
  return groups.join("-");
}

export function computeStatus(data) {
  if (!data) return "not_found";
  if (data.blocked) return "blocked";
  if (data.expiresAt && Date.now() > data.expiresAt) return "expired";
  if (!data.activatedAt) return "not_activated";
  return "active";
}
