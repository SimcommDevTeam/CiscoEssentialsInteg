import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const server = process.env.DB_SERVER;
    const database = process.env.DB_DATABASE;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433;

    if (!server || !database || !user || !password) {
      throw new Error(
        "DB_SERVER, DB_DATABASE, DB_USER, and DB_PASSWORD environment variables are required"
      );
    }

    poolPromise = sql.connect({ server, database, user, password, port, options: { encrypt: false, trustServerCertificate: true } });
  }
  return poolPromise;
}
