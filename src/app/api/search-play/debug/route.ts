import { NextRequest, NextResponse } from "next/server";
import { getAPIConfigs } from "@/lib/server/apiConfigRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const config = await getAPIConfigs(["WEBEX_BEARER_TOKEN", "WEBEX_API_BASE_URL"]);
  const baseUrl = config.WEBEX_API_BASE_URL;
  const headers: HeadersInit = {
    Authorization: `Bearer ${config.WEBEX_BEARER_TOKEN}`,
    Accept: "application/json;charset=UTF-8"
  };

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
