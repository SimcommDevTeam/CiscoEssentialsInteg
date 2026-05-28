import { NextResponse } from "next/server";
import { testScreenPopupDbConnection } from "@/lib/server/screenPopupRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await testScreenPopupDbConnection();

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        sqlConfig: {
          server: process.env.DB_SERVER,
          port: process.env.DB_PORT ?? "1433",
          database: process.env.DB_DATABASE,
          user: process.env.DB_USER,
          passwordLength: process.env.DB_PASSWORD?.length,
          encrypt: false,
          trustServerCertificate: true
        }
      },
      { status: 500 }
    );
  }
}
