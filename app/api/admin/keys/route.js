import { NextResponse } from "next/server";
import { redis } from "../../../../lib/redis";
import { checkAdmin } from "../../../../lib/adminAuth";
import { generateKeyString, computeStatus } from "../../../../lib/keys";

export async function GET(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const keyList = await redis.smembers("keys:all");
  const keys = [];

  for (const k of keyList) {
    const data = await redis.get(`key:${k}`);
    if (data) {
      keys.push({ ...data, status: computeStatus(data) });
    }
  }

  keys.sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ keys });
}

export async function POST(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 500);
  const ttlDays = Math.max(parseInt(body.ttlDays) || 30, 1);
  const maxActivations = Math.max(parseInt(body.maxActivations) || 1, 1);
  const note = (body.note || "").toString().slice(0, 200);

  const createdKeys = [];

  for (let i = 0; i < count; i++) {
    let keyStr;
    let exists = true;
    while (exists) {
      keyStr = generateKeyString();
      exists = await redis.exists(`key:${keyStr}`);
    }

    const data = {
      key: keyStr,
      note,
      ttlDays,
      maxActivations,
      activationsCount: 0,
      hwids: [],
      createdAt: Date.now(),
      activatedAt: null,
      expiresAt: null,
      blocked: false,
    };

    await redis.set(`key:${keyStr}`, data);
    await redis.sadd("keys:all", keyStr);
    createdKeys.push(keyStr);
  }

  return NextResponse.json({ created: createdKeys });
}
