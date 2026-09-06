import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const keyStr = (body.key || "").toString().trim().toUpperCase();
  const hwid = (body.hwid || "").toString().trim();

  if (!keyStr || !hwid) {
    return NextResponse.json({ valid: false, reason: "missing_params" }, { status: 400 });
  }

  const data = await redis.get(`key:${keyStr}`);

  if (!data) {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  }
  if (data.blocked) {
    return NextResponse.json({ valid: false, reason: "blocked" }, { status: 403 });
  }

  const hwids = Array.isArray(data.hwids) ? data.hwids : [];

  if (hwids.includes(hwid)) {
    const daysLeft = data.expiresAt
      ? Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 86400000))
      : null;
    return NextResponse.json({
      valid: true,
      alreadyActivated: true,
      expiresAt: data.expiresAt,
      daysLeft,
      note: data.note || "",
    });
  }

  if (hwids.length >= data.maxActivations) {
    return NextResponse.json({ valid: false, reason: "device_limit_reached" }, { status: 403 });
  }

  const now = Date.now();

  if (!data.activatedAt) {
    data.activatedAt = now;
    data.expiresAt = now + data.ttlDays * 86400000;
  }

  data.hwids = [...hwids, hwid];
  data.activationsCount = (data.activationsCount || 0) + 1;

  await redis.set(`key:${keyStr}`, data);

  const daysLeft = Math.max(0, Math.ceil((data.expiresAt - now) / 86400000));

  return NextResponse.json({
    valid: true,
    expiresAt: data.expiresAt,
    daysLeft,
    note: data.note || "",
  });
}
