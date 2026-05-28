import { NextRequest, NextResponse } from "next/server";
import type { ScreenPopupCallInfo, ScreenPopupCustomerInfo } from "@/types";
import {
  getScreenPopupInfoByStatus,
  saveDisposition,
  saveScreenPopupInfo
} from "@/lib/server/screenPopupRepository";
import { getAPIConfigs } from "@/lib/server/apiConfigRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const queryKeys: Array<keyof ScreenPopupCallInfo> = [
  "ANI",
  "DNIS",
  "InteractionID",
  "AgentID",
  "AgentName",
  "QueueID",
  "QueueName",
  "TenantID"
];

interface SalesforceContactResponse {
  totalSize: number;
  done: boolean;
  records: Array<{
    Email: string | null;
    Name: string | null;
    Id: string | null;
    Phone: string | null;
    MailingCity: string | null;
    MailingCountry: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hasCallQuery = queryKeys.some((key) => searchParams.has(key));
    const ended = await getScreenPopupInfoByStatus("ended");

    if (!hasCallQuery) {
      const active = await getScreenPopupInfoByStatus("active");

      return NextResponse.json({
        mode: "active-from-db",
        active,
        current: active[0] ?? null,
        ended
      });
    }

    const callInfo = readCallInfo(searchParams);
    const queryPayload = Object.fromEntries(
      queryKeys.map((key) => [key, callInfo[key]])
    );
    const salesforceResponse = await fetchSalesforceContact(callInfo.ANI);
    const customerInfo = normalizeCustomer(salesforceResponse);
    const current = await saveScreenPopupInfo(
      callInfo,
      customerInfo,
      queryPayload,
      salesforceResponse
    );

    return NextResponse.json({
      mode: "created-from-url",
      current,
      active: [current],
      ended
    });
  } catch (error) {
    const message = formatError(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, disposition, dispositionSub } = body as {
      id?: unknown;
      disposition?: unknown;
      dispositionSub?: unknown;
    };

    if (
      !id ||
      !disposition || typeof disposition !== "string" || disposition.trim() === "" ||
      !dispositionSub || typeof dispositionSub !== "string" || dispositionSub.trim() === ""
    ) {
      return NextResponse.json(
        { error: "id, disposition, and dispositionSub are required" },
        { status: 400 }
      );
    }

    const result = await saveDisposition(Number(id), disposition.trim(), dispositionSub.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

function formatError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to load screen popup info";
  }

  const maybeSqlError = error as Error & {
    code?: string;
    number?: number;
    state?: number;
    originalError?: Error & { info?: { message?: string; number?: number; state?: number } };
  };
  const details = [
    error.message,
    maybeSqlError.originalError?.message,
    maybeSqlError.originalError?.info?.message
  ].filter(Boolean);
  const uniqueDetails = Array.from(new Set(details));
  const sqlMeta = [
    maybeSqlError.code ? `code=${maybeSqlError.code}` : "",
    maybeSqlError.number ? `number=${maybeSqlError.number}` : "",
    maybeSqlError.state ? `state=${maybeSqlError.state}` : "",
    maybeSqlError.originalError?.info?.number ? `sqlNumber=${maybeSqlError.originalError.info.number}` : "",
    maybeSqlError.originalError?.info?.state ? `sqlState=${maybeSqlError.originalError.info.state}` : ""
  ].filter(Boolean);

  return [...uniqueDetails, sqlMeta.length ? `(${sqlMeta.join(", ")})` : ""].filter(Boolean).join(" ");
}

function readCallInfo(searchParams: URLSearchParams): ScreenPopupCallInfo {
  return queryKeys.reduce(
    (info, key) => ({
      ...info,
      [key]: searchParams.get(key) ?? ""
    }),
    {} as ScreenPopupCallInfo
  );
}

async function fetchSalesforceContact(ani: string): Promise<SalesforceContactResponse> {
  const config = await getAPIConfigs(["SALESFORCE_BEARER_TOKEN"]);
  const Salestoken = config.SALESFORCE_BEARER_TOKEN;

  const soql = `SELECT Email,name,id,phone,MailingCity,MailingCountry from contact where phone ='${escapeSoql(
    ani
  )}'`;
  const url = `https://momentum-energy-3066.my.salesforce.com/services/data/v66.0/query/?q=${encodeURIComponent(
    soql
  )}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${Salestoken}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Salesforce contact lookup failed with status ${response.status}`);
  }

  return response.json();
}

function normalizeCustomer(response: SalesforceContactResponse): ScreenPopupCustomerInfo | null {
  const contact = response.records[0];

  if (!contact) {
    return null;
  }

  return {
    Name: contact.Name,
    Email: contact.Email,
    Id: contact.Id,
    Phone: contact.Phone,
    MailingCity: contact.MailingCity,
    MailingCountry: contact.MailingCountry
  };
}

function escapeSoql(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
