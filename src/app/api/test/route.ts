export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {

  return Response.json({
    token: process.env["SALESFORCE_BEARER_TOKEN"]
      ? "FOUND"
      : "NOT FOUND"
  });
}