-- ── Step 1: Add Disposition column if it does not already exist ────────────
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.tbl_screenpopupInfo')
      AND name = N'Disposition'
)
BEGIN
    ALTER TABLE dbo.tbl_screenpopupInfo
        ADD Disposition NVARCHAR(100) NULL;
END;
GO

-- ── Step 2: Update usp_SaveScreenPopupInfo to SELECT Disposition ───────────
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
        ANI, DNIS, InteractionID, AgentID, AgentName, QueueID, QueueName, TenantID,
        CustomerName, Email, CustomerId, Phone, MailingCity, MailingCountry,
        UrlQueryJson, SalesforceResponseJson, Status
    )
    VALUES
    (
        @ANI, @DNIS, @InteractionID, @AgentID, @AgentName, @QueueID, @QueueName, @TenantID,
        @CustomerName, @Email, @CustomerId, @Phone, @MailingCity, @MailingCountry,
        @UrlQueryJson, @SalesforceResponseJson, @Status
    );

    SELECT TOP (1)
        Id, ANI, DNIS, InteractionID, AgentID, AgentName, QueueID, QueueName, TenantID,
        CustomerName, Email, CustomerId, Phone, MailingCity, MailingCountry,
        Disposition, Status, CreatedAt, UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Id = SCOPE_IDENTITY();
END;
GO

-- ── Step 3: Update usp_GetScreenPopupInfoByStatus to SELECT Disposition ────
CREATE OR ALTER PROCEDURE dbo.usp_GetScreenPopupInfoByStatus
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id, ANI, DNIS, InteractionID, AgentID, AgentName, QueueID, QueueName, TenantID,
        CustomerName, Email, CustomerId, Phone, MailingCity, MailingCountry,
        Disposition, Status, CreatedAt, UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Status = @Status
    ORDER BY CreatedAt DESC;
END;
GO

-- ── Step 4: Update usp_UpdateScreenPopupInfoStatus to SELECT Disposition ───
CREATE OR ALTER PROCEDURE dbo.usp_UpdateScreenPopupInfoStatus
    @Id INT,
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.tbl_screenpopupInfo
    SET Status = @Status, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id;

    SELECT
        Id, ANI, DNIS, InteractionID, AgentID, AgentName, QueueID, QueueName, TenantID,
        CustomerName, Email, CustomerId, Phone, MailingCity, MailingCountry,
        Disposition, Status, CreatedAt, UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Id = @Id;
END;
GO

-- ── Step 5: New SP — save agent disposition for a call record ──────────────
CREATE OR ALTER PROCEDURE dbo.usp_SaveDisposition
    @Id INT,
    @Disposition NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.tbl_screenpopupInfo
    SET Disposition = @Disposition, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id;

    SELECT Id, Disposition, UpdatedAt
    FROM dbo.tbl_screenpopupInfo
    WHERE Id = @Id;
END;
GO
