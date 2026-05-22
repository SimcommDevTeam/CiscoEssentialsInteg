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
          server: process.env.SQL_SERVER,
          port: process.env.SQL_PORT,
          database: process.env.SQL_DATABASE,
          user: process.env.SQL_USER,
          passwordLength: process.env.SQL_PASSWORD?.length,
          encrypt: process.env.SQL_ENCRYPT,
          trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE
        }
      },
      { status: 500 }
    );
  }
}
