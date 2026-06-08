import sql from "mssql";
import type { ScreenPopupCallInfo, ScreenPopupCustomerInfo, ScreenPopupRecord } from "@/types";
<<<<<<< HEAD
=======
import { getPool } from "./dbPool";
>>>>>>> prod

interface DbRow {
  Id: number;
  ANI: string | null;
  DNIS: string | null;
  InteractionID: string | null;
  AgentID: string | null;
  AgentName: string | null;
  QueueID: string | null;
  QueueName: string | null;
  TenantID: string | null;
  CustomerName: string | null;
  Email: string | null;
  CustomerId: string | null;
  Phone: string | null;
  MailingCity: string | null;
  MailingCountry: string | null;
<<<<<<< HEAD
=======
  Disposition: string | null;
  DispositionSub: string | null;
>>>>>>> prod
  Status: string;
  CreatedAt: Date;
  UpdatedAt: Date | null;
}

<<<<<<< HEAD
let poolPromise: Promise<sql.ConnectionPool> | undefined;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function getPool() {
  if (!poolPromise) {
    const port = Number(process.env.SQL_PORT ?? "1433");

    poolPromise = sql.connect({
      server: requiredEnv("SQL_SERVER"),
      database: requiredEnv("SQL_DATABASE"),
      user: requiredEnv("SQL_USER"),
      password: requiredEnv("SQL_PASSWORD"),
      port,
      options: {
        encrypt: process.env.SQL_ENCRYPT !== "false",
        trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === "true"
      }
    });
  }

  return poolPromise;
}
=======
interface DispositionRow {
  Id: number;
  Disposition: string | null;
  DispositionSub: string | null;
  UpdatedAt: Date | null;
}

>>>>>>> prod

export async function saveScreenPopupInfo(
  callInfo: ScreenPopupCallInfo,
  customerInfo: ScreenPopupCustomerInfo | null,
  queryPayload: Record<string, string>,
  salesforceResponse: unknown
) {
  const pool = await getPool();
  const request = pool.request();

  request.input("ANI", sql.NVarChar(50), callInfo.ANI);
  request.input("DNIS", sql.NVarChar(50), callInfo.DNIS);
  request.input("InteractionID", sql.NVarChar(100), callInfo.InteractionID);
  request.input("AgentID", sql.NVarChar(100), callInfo.AgentID);
  request.input("AgentName", sql.NVarChar(200), callInfo.AgentName);
  request.input("QueueID", sql.NVarChar(100), callInfo.QueueID);
  request.input("QueueName", sql.NVarChar(200), callInfo.QueueName);
  request.input("TenantID", sql.NVarChar(100), callInfo.TenantID);
  request.input("CustomerName", sql.NVarChar(200), customerInfo?.Name ?? null);
  request.input("Email", sql.NVarChar(320), customerInfo?.Email ?? null);
  request.input("CustomerId", sql.NVarChar(50), customerInfo?.Id ?? null);
  request.input("Phone", sql.NVarChar(50), customerInfo?.Phone ?? null);
  request.input("MailingCity", sql.NVarChar(150), customerInfo?.MailingCity ?? null);
  request.input("MailingCountry", sql.NVarChar(150), customerInfo?.MailingCountry ?? null);
  request.input("UrlQueryJson", sql.NVarChar(sql.MAX), JSON.stringify(queryPayload));
  request.input("SalesforceResponseJson", sql.NVarChar(sql.MAX), JSON.stringify(salesforceResponse));
  request.input("Status", sql.NVarChar(20), "active");

  const result = await request.execute<DbRow>("dbo.usp_SaveScreenPopupInfo");
  return mapRow(result.recordset[0]);
}

<<<<<<< HEAD
export async function getScreenPopupInfoByStatus(status: "active" | "ended") {
=======
export async function getScreenPopupInfoByStatus(status: "active" | "ended", agentId?: string | null) {
>>>>>>> prod
  const pool = await getPool();
  const request = pool.request();

  request.input("Status", sql.NVarChar(20), status);
<<<<<<< HEAD
=======
  request.input("AgentId", sql.NVarChar(100), agentId ?? null);
>>>>>>> prod
  const result = await request.execute<DbRow>("dbo.usp_GetScreenPopupInfoByStatus");

  return result.recordset.map(mapRow);
}

export async function testScreenPopupDbConnection() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query<{ loginName: string; databaseName: string }>("SELECT SUSER_SNAME() AS loginName, DB_NAME() AS databaseName");

  return result.recordset[0];
}

<<<<<<< HEAD
=======
export async function saveDisposition(id: number, disposition: string, dispositionSub: string) {
  const pool = await getPool();
  const request = pool.request();

  request.input("Id", sql.Int, id);
  request.input("Disposition", sql.NVarChar(100), disposition);
  request.input("DispositionSub", sql.NVarChar(100), dispositionSub);

  const result = await request.execute<DispositionRow>("dbo.usp_SaveDisposition");
  return result.recordset[0];
}

>>>>>>> prod
function mapRow(row: DbRow): ScreenPopupRecord {
  return {
    id: row.Id,
    status: row.Status,
<<<<<<< HEAD
=======
    disposition: row.Disposition ?? null,
    dispositionSub: row.DispositionSub ?? null,
>>>>>>> prod
    createdAt: row.CreatedAt.toISOString(),
    updatedAt: row.UpdatedAt?.toISOString() ?? null,
    callInfo: {
      ANI: row.ANI ?? "",
      DNIS: row.DNIS ?? "",
      InteractionID: row.InteractionID ?? "",
      AgentID: row.AgentID ?? "",
      AgentName: row.AgentName ?? "",
      QueueID: row.QueueID ?? "",
      QueueName: row.QueueName ?? "",
      TenantID: row.TenantID ?? ""
    },
    customerInfo: {
      Name: row.CustomerName,
      Email: row.Email,
      Id: row.CustomerId,
      Phone: row.Phone,
      MailingCity: row.MailingCity,
      MailingCountry: row.MailingCountry
    }
  };
}
