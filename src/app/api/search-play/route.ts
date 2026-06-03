import { NextRequest, NextResponse } from "next/server";
import { getAPIConfigs } from "@/lib/server/apiConfigRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebexRecordingListItem {
  id: string;
  durationSeconds: number;
  status: string;
  timeRecorded: string;
}

interface WebexRecordingListResponse {
  items: WebexRecordingListItem[];
}

interface WebexRecordingMetadata {
  id: string;
  serviceData: {
    callingParty: {
      number: string;
    };
    calledParty: {
      number: string;
    };
  };
}

interface WebexRecordingDetail {
  temporaryDirectDownloadLinks: {
    audioDownloadLink: string;
  };
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
    const config = await getAPIConfigs(["WEBEX_BEARER_TOKEN", "WEBEX_API_BASE_URL"]);
    const baseUrl = config.WEBEX_API_BASE_URL;
    const headers: HeadersInit = {
      Authorization: `Bearer ${config.WEBEX_BEARER_TOKEN}`,
      Accept: "application/json;charset=UTF-8"
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const from = searchParams.get("from") ?? sevenDaysAgo.toISOString();
    const to = searchParams.get("to") ?? now.toISOString();

    // Fetch available and deleted recordings in parallel
    const makeListUrl = (status: string) => {
      const url = new URL(`${baseUrl}/convergedRecordings`);
      url.searchParams.set("status", status);
      url.searchParams.set("max", "100");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      return url.toString();
    };

    const [availableRes, deletedRes] = await Promise.all([
      fetch(makeListUrl("available"), { headers, cache: "no-store" }),
      fetch(makeListUrl("deleted"), { headers, cache: "no-store" })
    ]);

    if (!availableRes.ok) {
      const errorText = await availableRes.text();
      return NextResponse.json(
        { error: `Webex recordings list failed: ${availableRes.status} ${errorText}` },
        { status: availableRes.status }
      );
    }

    const availableData: WebexRecordingListResponse = await availableRes.json();
    const deletedData: WebexRecordingListResponse = deletedRes.ok ? await deletedRes.json() : { items: [] };
    const items = [...(availableData.items ?? []), ...(deletedData.items ?? [])];

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
          audioDownloadLink = detail.temporaryDirectDownloadLinks?.audioDownloadLink ?? "";
        }

        return {
          id: metadata?.id ?? item.id,
          callStartDate: formatDate(item.timeRecorded ?? ""),
          callEndDate: formatDate(
            item.timeRecorded
              ? new Date(new Date(item.timeRecorded).getTime() + (item.durationSeconds ?? 0) * 1000).toISOString()
              : ""
          ),
          ani: metadata?.serviceData?.callingParty?.number ?? "",
          dnis: metadata?.serviceData?.calledParty?.number ?? "",
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
