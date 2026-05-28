-- ── Step 1: Create tbl_APIConfig ────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'dbo.tbl_APIConfig') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.tbl_APIConfig (
        Id            INT           IDENTITY(1,1) NOT NULL,
        ConfigKey     NVARCHAR(100) NOT NULL,
        ConfigValue   NVARCHAR(MAX) NOT NULL,
        Description   NVARCHAR(500) NULL,
        IsActive      BIT           NOT NULL CONSTRAINT DF_tbl_APIConfig_IsActive  DEFAULT 1,
        CreatedAt     DATETIME2(7)  NOT NULL CONSTRAINT DF_tbl_APIConfig_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt     DATETIME2(7)  NULL,
        CONSTRAINT PK_tbl_APIConfig        PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_tbl_APIConfig_ConfigKey UNIQUE (ConfigKey)
    );
END;
GO

-- ── Step 2: Seed the three required keys (no-op if already present) ──────────
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_APIConfig WHERE ConfigKey = N'WEBEX_API_BASE_URL')
    INSERT INTO dbo.tbl_APIConfig (ConfigKey, ConfigValue, Description)
    VALUES (N'WEBEX_API_BASE_URL', N'https://webexapis.com/v1', N'Webex API base URL');

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_APIConfig WHERE ConfigKey = N'WEBEX_BEARER_TOKEN')
    INSERT INTO dbo.tbl_APIConfig (ConfigKey, ConfigValue, Description)
    VALUES (N'WEBEX_BEARER_TOKEN', N'REPLACE_WITH_TOKEN', N'Webex Bearer Token for API authentication');

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_APIConfig WHERE ConfigKey = N'SALESFORCE_BEARER_TOKEN')
    INSERT INTO dbo.tbl_APIConfig (ConfigKey, ConfigValue, Description)
    VALUES (N'SALESFORCE_BEARER_TOKEN', N'REPLACE_WITH_TOKEN', N'Salesforce Bearer Token for API authentication');
GO

-- ── Step 3: usp_GetAPIConfig — fetch one key ────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.usp_GetAPIConfig
    @ConfigKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ConfigKey, ConfigValue, IsActive, UpdatedAt
    FROM dbo.tbl_APIConfig
    WHERE ConfigKey = @ConfigKey AND IsActive = 1;
END;
GO

-- ── Step 4: usp_GetAllAPIConfig — fetch all active keys ─────────────────────
CREATE OR ALTER PROCEDURE dbo.usp_GetAllAPIConfig
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ConfigKey, ConfigValue, Description, IsActive, CreatedAt, UpdatedAt
    FROM dbo.tbl_APIConfig
    WHERE IsActive = 1
    ORDER BY ConfigKey;
END;
GO

-- ── Step 5: usp_SetAPIConfig — upsert a single config entry ─────────────────
CREATE OR ALTER PROCEDURE dbo.usp_SetAPIConfig
    @ConfigKey   NVARCHAR(100),
    @ConfigValue NVARCHAR(MAX),
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.tbl_APIConfig WHERE ConfigKey = @ConfigKey)
    BEGIN
        UPDATE dbo.tbl_APIConfig
        SET ConfigValue = @ConfigValue,
            Description = COALESCE(@Description, Description),
            UpdatedAt   = SYSUTCDATETIME()
        WHERE ConfigKey = @ConfigKey;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.tbl_APIConfig (ConfigKey, ConfigValue, Description)
        VALUES (@ConfigKey, @ConfigValue, @Description);
    END;

    SELECT Id, ConfigKey, ConfigValue, Description, IsActive, CreatedAt, UpdatedAt
    FROM dbo.tbl_APIConfig
    WHERE ConfigKey = @ConfigKey;
END;
GO
