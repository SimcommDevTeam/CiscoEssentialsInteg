IF OBJECT_ID(N'dbo.tbl_screenpopupInfo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_screenpopupInfo
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tbl_screenpopupInfo PRIMARY KEY,
        ANI NVARCHAR(50) NULL,
        DNIS NVARCHAR(50) NULL,
        InteractionID NVARCHAR(100) NULL,
        AgentID NVARCHAR(100) NULL,
        AgentName NVARCHAR(200) NULL,
        QueueID NVARCHAR(100) NULL,
        QueueName NVARCHAR(200) NULL,
        TenantID NVARCHAR(100) NULL,
        CustomerName NVARCHAR(200) NULL,
        Email NVARCHAR(320) NULL,
        CustomerId NVARCHAR(50) NULL,
        Phone NVARCHAR(50) NULL,
        MailingCity NVARCHAR(150) NULL,
        MailingCountry NVARCHAR(150) NULL,
        UrlQueryJson NVARCHAR(MAX) NULL,
        SalesforceResponseJson NVARCHAR(MAX) NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_tbl_screenpopupInfo_Status DEFAULT N'active',
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_tbl_screenpopupInfo_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2(3) NULL
    );

    CREATE INDEX IX_tbl_screenpopupInfo_Status_CreatedAt
        ON dbo.tbl_screenpopupInfo (Status, CreatedAt DESC);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_SaveScreenPopupInfo
    @ANI NVARCHAR(50) = NULL,
    @DNIS NVARCHAR(50) = NULL,
    @InteractionID NVARCHAR(100) = NULL,
    @AgentID NVARCHAR(100) = NULL,
    @AgentName NVARCHAR(200) = NULL,
    @QueueID NVARCHAR(100) = NULL,
    @QueueName NVARCHAR(200) = NULL,
    @TenantID NVARCHAR(100) = NULL,
    @CustomerName NVARCHAR(200) = NULL,
    @Email NVARCHAR(320) = NULL,
    @CustomerId NVARCHAR(50) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @MailingCity NVARCHAR(150) = NULL,
    @MailingCountry NVARCHAR(150) = NULL,
    @UrlQueryJson NVARCHAR(MAX) = NULL,
    @SalesforceResponseJson NVARCHAR(MAX) = NULL,
    @Status NVARCHAR(20) = N'active'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.tbl_screenpopupInfo
    (
        ANI,
        DNIS,
        InteractionID,
        AgentID,
        AgentName,
        QueueID,
        QueueName,
        TenantID,
        CustomerName,
        Email,
        CustomerId,
        Phone,
        MailingCity,
        MailingCountry,
        UrlQueryJson,
        SalesforceResponseJson,
        Status
    )
    VALUES
    (
        @ANI,
        @DNIS,
        @InteractionID,
        @AgentID,
        @AgentName,
        @QueueID,
        @QueueName,
        @TenantID,
        @CustomerName,
        @Email,
        @CustomerId,
        @Phone,
        @MailingCity,
        @MailingCountry,
        @UrlQueryJson,
        @SalesforceResponseJson,
        @Status
    );

    SELECT TOP (1)
        Id,
        ANI,
        DNIS,
        InteractionID,
        AgentID,
        AgentName,
        QueueID,
        QueueName,
        TenantID,
        CustomerName,
        Email,
        CustomerId,
        Phone,
        MailingCity,
        MailingCountry,
        Status,
        CreatedAt,
        UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Id = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetScreenPopupInfoByStatus
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        ANI,
        DNIS,
        InteractionID,
        AgentID,
        AgentName,
        QueueID,
        QueueName,
        TenantID,
        CustomerName,
        Email,
        CustomerId,
        Phone,
        MailingCity,
        MailingCountry,
        Status,
        CreatedAt,
        UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Status = @Status
    ORDER BY CreatedAt DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_UpdateScreenPopupInfoStatus
    @Id INT,
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.tbl_screenpopupInfo
    SET
        Status = @Status,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id;

    SELECT
        Id,
        ANI,
        DNIS,
        InteractionID,
        AgentID,
        AgentName,
        QueueID,
        QueueName,
        TenantID,
        CustomerName,
        Email,
        CustomerId,
        Phone,
        MailingCity,
        MailingCountry,
        Status,
        CreatedAt,
        UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Id = @Id;
END;
GO
