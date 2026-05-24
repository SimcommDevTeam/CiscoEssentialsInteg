import { NextResponse } from "next/server";
import { screenPopupDbConfig, testScreenPopupDbConnection } from "@/lib/server/screenPopupRepository";

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
          server: screenPopupDbConfig.server,
          port: screenPopupDbConfig.port,
          database: screenPopupDbConfig.database,
          user: screenPopupDbConfig.user,
          passwordLength: screenPopupDbConfig.password?.length,
          encrypt: screenPopupDbConfig.options?.encrypt,
          trustServerCertificate: screenPopupDbConfig.options?.trustServerCertificate
        }
      },
      { status: 500 }
    );
  }
}
