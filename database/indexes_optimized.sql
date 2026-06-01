-- ============================================================
-- Performance indexes for QM_DB_ANKIT
-- Run this script ONCE on the database.
-- All indexes use ONLINE = ON so they build without blocking.
-- ============================================================

USE [QM_DB_ANKIT];
GO

-- ── 1. TblMst_Metadata — covering index for the interaction-list query ───────
-- Seek on audio_start_time (date-range filter), agent_id in key so the
-- UserDetails JOIN is resolved from the index without a key lookup.
-- Included columns cover every non-MAX SELECT column, eliminating bookmark
-- lookups for the 100K-row result sets.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TblMst_Metadata')
      AND name = 'IX_Metadata_AudioStart_AgentId_Covering'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Metadata_AudioStart_AgentId_Covering
    ON dbo.TblMst_Metadata (audio_start_time, agent_id)
    INCLUDE (
        interaction_id, call_id, ucid, ani, extension,
        channeltype, Platformid, appid,
        audio_end_time, timezone,
        personal_name, direction, duration,
        dnis_code, file_source_type, OrganizationID,
        -- Active custom columns (CustomColumn1/2/3/19 in this DB):
        CustomColumn1, CustomColumn2, CustomColumn3,
        CustomColumn4, CustomColumn5, CustomColumn6,
        CustomColumn7, CustomColumn8, CustomColumn9, CustomColumn10,
        CustomColumn11, CustomColumn12, CustomColumn13, CustomColumn14,
        CustomColumn15, CustomColumn16, CustomColumn17, CustomColumn18,
        CustomColumn19, CustomColumn20
    )
    WITH (ONLINE = ON, FILLFACTOR = 85);
    PRINT 'Created IX_Metadata_AudioStart_AgentId_Covering';
END
ELSE
    PRINT 'IX_Metadata_AudioStart_AgentId_Covering already exists — skipped';
GO

-- ── 2. TblMst_Metadata — support for agent_id-only searches ─────────────────
-- Helps the EXISTS sub-query inside the proc that looks up by agent_id.
-- Also helps searches where callId / ucid filters are applied.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TblMst_Metadata')
      AND name = 'IX_Metadata_AgentId_AudioStart'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Metadata_AgentId_AudioStart
    ON dbo.TblMst_Metadata (agent_id, audio_start_time)
    WITH (ONLINE = ON, FILLFACTOR = 85);
    PRINT 'Created IX_Metadata_AgentId_AudioStart';
END
ELSE
    PRINT 'IX_Metadata_AgentId_AudioStart already exists — skipped';
GO

-- ── 3. TblMst_UserDetails — recommended by SQL Server DMV (54 % impact) ──────
-- Equality seek on userId + is_active; avoids table scan for user lookups.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TblMst_UserDetails')
      AND name = 'IX_UserDetails_UserId_IsActive'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserDetails_UserId_IsActive
    ON dbo.TblMst_UserDetails (userId, is_active)
    WITH (ONLINE = ON);
    PRINT 'Created IX_UserDetails_UserId_IsActive';
END
ELSE
    PRINT 'IX_UserDetails_UserId_IsActive already exists — skipped';
GO

-- ── 4. TblMst_UserDetails — recommended by SQL Server DMV (49 % impact) ──────
-- Covers the JOIN pattern: is_active + DeleteStatus filter, returns userId &
-- user_login_id without a key lookup.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TblMst_UserDetails')
      AND name = 'IX_UserDetails_IsActive_DeleteStatus'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserDetails_IsActive_DeleteStatus
    ON dbo.TblMst_UserDetails (is_active, DeleteStatus)
    INCLUDE (userId, user_login_id, user_full_name)
    WITH (ONLINE = ON);
    PRINT 'Created IX_UserDetails_IsActive_DeleteStatus';
END
ELSE
    PRINT 'IX_UserDetails_IsActive_DeleteStatus already exists — skipped';
GO

-- ── 5. TblMap_UserAgentOrganization — support the EXISTS org-filter ──────────
-- The existing IX_UserAgentOrg_UserId_OrgId (user_id, org_id) already covers
-- this well.  No new index needed here.
PRINT 'TblMap_UserAgentOrganization: existing IX_UserAgentOrg_UserId_OrgId covers the EXISTS filter — no new index needed';
GO

PRINT '=== All indexes applied ===';
GO
