import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebexRecordingListItem {
  id: string;
  durationSeconds: number;
  status: string;
}

interface WebexRecordingListResponse {
  items: WebexRecordingListItem[];
}

interface WebexRecordingMetadata {
  id: string;
  session: {
    startTime: string;
    stopTime: string;
  };
  callingParty: {
    number: string;
  };
  calledParty: {
    number: string;
  };
}

interface WebexRecordingDetail {
  audioDownloadLink: string;
}

function getWebexHeaders(): HeadersInit {
  const token = process.env.WEBEX_BEARER_TOKEN;
  if (!token) {
    throw new Error("WEBEX_BEARER_TOKEN environment variable is required");
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json;charset=UTF-8"
  };
}

function getBaseUrl(): string {
  return process.env.WEBEX_API_BASE_URL ?? "https://webexapis.com/v1";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return isoString;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseUrl = getBaseUrl();
    const headers = getWebexHeaders();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const from = searchParams.get("from") ?? sevenDaysAgo.toISOString();
    const to = searchParams.get("to") ?? now.toISOString();

    // Fetch recordings list (API a)
    const listUrl = new URL(`${baseUrl}/convergedRecordings`);
    listUrl.searchParams.set("max", "100");
    listUrl.searchParams.set("from", from);
    listUrl.searchParams.set("to", to);

    const listResponse = await fetch(listUrl.toString(), {
      headers,
      cache: "no-store"
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      return NextResponse.json(
        { error: `Webex recordings list failed: ${listResponse.status} ${errorText}` },
        { status: listResponse.status }
      );
    }

    const listData: WebexRecordingListResponse = await listResponse.json();
    const items = listData.items ?? [];

    // For each recording fetch metadata (API b) and detail/download link (API c) in parallel
    const recordings = await Promise.all(
      items.map(async (item) => {
        const [metadataResult, detailResult] = await Promise.allSettled([
          fetch(`${baseUrl}/convergedRecordings/${item.id}/metadata`, {
            headers,
            cache: "no-store"
          }),
          fetch(`${baseUrl}/convergedRecordings/${item.id}`, {
            headers,
            cache: "no-store"
          })
        ]);

        let metadata: WebexRecordingMetadata | null = null;
        let audioDownloadLink = "";

        if (metadataResult.status === "fulfilled" && metadataResult.value.ok) {
          metadata = await metadataResult.value.json();
        }

        if (detailResult.status === "fulfilled" && detailResult.value.ok) {
          const detail: WebexRecordingDetail = await detailResult.value.json();
          audioDownloadLink = detail.audioDownloadLink ?? "";
        }

        return {
          id: metadata?.id ?? item.id,
          callStartDate: formatDate(metadata?.session?.startTime ?? ""),
          callEndDate: formatDate(metadata?.session?.stopTime ?? ""),
          ani: metadata?.callingParty?.number ?? "",
          dnis: metadata?.calledParty?.number ?? "",
          duration: formatDuration(item.durationSeconds ?? 0),
          callType: item.status ?? "",
          recordingUrl: audioDownloadLink,
          recordingFileName: `${item.id}.wav`
        };
      })
    );

    return NextResponse.json({ recordings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recordings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
