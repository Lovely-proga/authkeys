import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/redis";
import { checkAdmin } from "../../../../../lib/adminAuth";
import { computeStatus } from "../../../../../lib/keys";

export async function PATCH(request, { params }) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const keyStr = params.key;
  const data = await redis.get(`key:${keyStr}`);

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === "block") {
    data.blocked = true;
  } else if (body.action === "unblock") {
    data.blocked = false;
  } else if (body.action === "extend") {
    const days = parseInt(body.days) || 0;
    if (data.expiresAt) {
      data.expiresAt = data.expiresAt + days * 86400000;
    } else {
      data.ttlDays = (data.ttlDays || 0) + days;
    }
  } else {
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  await redis.set(`key:${keyStr}`, data);

  return NextResponse.json({ key: { ...data, status: computeStatus(data) } });
}

export async function DELETE(request, { params }) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const keyStr = params.key;
  await redis.del(`key:${keyStr}`);
  await redis.srem("keys:all", keyStr);

  return NextResponse.json({ deleted: keyStr });
}
