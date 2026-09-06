import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const keyStr = (body.key || "").toString().trim().toUpperCase();
  const hwid = (body.hwid || "").toString().trim();

  if (!keyStr) {
    return NextResponse.json({ valid: false, reason: "missing_key" }, { status: 400 });
  }

  const data = await redis.get(`key:${keyStr}`);

  if (!data) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }
  if (data.blocked) {
    return NextResponse.json({ valid: false, reason: "blocked" });
  }
  if (!data.activatedAt) {
    return NextResponse.json({ valid: false, reason: "not_activated" });
  }
  if (data.expiresAt && Date.now() > data.expiresAt) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }
  if (hwid && Array.isArray(data.hwids) && !data.hwids.includes(hwid)) {
    return NextResponse.json({ valid: false, reason: "device_mismatch" });
  }

  const daysLeft = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 86400000));

  return NextResponse.json({
    valid: true,
    daysLeft,
    expiresAt: data.expiresAt,
    note: data.note || "",
  });
}
