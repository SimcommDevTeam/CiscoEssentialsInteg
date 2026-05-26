import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWebexHeaders(): HeadersInit {
  const token = process.env.WEBEX_BEARER_TOKEN;
  if (!token) throw new Error("WEBEX_BEARER_TOKEN environment variable is required");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json;charset=UTF-8"
  };
}

function getBaseUrl(): string {
  return process.env.WEBEX_API_BASE_URL ?? "https://webexapis.com/v1";
}

/**
 * Debug endpoint — returns raw Webex API responses for a single recording.
 * Use this in Postman to inspect the exact field names returned by Webex.
 *
 * GET /api/search-play/debug?id=RECORDING_ID
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query param: id", usage: "/api/search-play/debug?id=RECORDING_ID" },
      { status: 400 }
    );
  }

  const baseUrl = getBaseUrl();
  const headers = getWebexHeaders();

  const [metadataRes, detailRes] = await Promise.allSettled([
    fetch(`${baseUrl}/convergedRecordings/${id}/metadata`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/convergedRecordings/${id}`, { headers, cache: "no-store" })
  ]);

  async function resolveResult(result: PromiseSettledResult<Response>) {
    if (result.status === "rejected") {
      return { _error: String(result.reason) };
    }
    const res = result.value;
    const body = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    return { _status: res.status, _ok: res.ok, _body: parsed };
  }

  const [metadata, detail] = await Promise.all([
    resolveResult(metadataRes),
    resolveResult(detailRes)
  ]);

  return NextResponse.json({
    recordingId: id,
    metadataEndpoint: `${baseUrl}/convergedRecordings/${id}/metadata`,
    detailEndpoint: `${baseUrl}/convergedRecordings/${id}`,
    metadata,
    detail
  });
}
