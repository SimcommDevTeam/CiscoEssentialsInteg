USE [QM_DB_Ankit]
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_GetInteractions]
    @pageNo            INT            = 1,
    @rowCountPerPage   INT            = 15,
    @search            NVARCHAR(256)  = NULL,
    @fromDate          DATETIME       = NULL,
    @toDate            DATETIME       = NULL,
    @organizationIds   NVARCHAR(MAX)  = NULL,
    @agentNameIds      NVARCHAR(MAX)  = NULL,
    @extensions        NVARCHAR(100)  = NULL,
    @callId            NVARCHAR(50)   = NULL,
    @ucid              NVARCHAR(50)   = NULL,
    @agent             NVARCHAR(50)   = NULL,
    @formIds           NVARCHAR(MAX)  = NULL,
    @evaluatorIds      NVARCHAR(MAX)  = NULL,
    @instanceNameIds   NVARCHAR(MAX)  = NULL,
    @platformIds       NVARCHAR(MAX)  = NULL,
    @channelTypeIds    NVARCHAR(MAX)  = NULL,
    @durationOperator  NVARCHAR(10)   = NULL,
    @durationValue     INT            = NULL,
    @durationValue2    INT            = NULL,
    @aniDni            NVARCHAR(50)   = NULL,
    @userId            INT,
    @timezone          NVARCHAR(50)   = NULL,
    @querytype         INT            = 0,
    @ActiveStatus      INT            = 0,
    @privilegeId       INT            = 0,
    @outputmsg         NVARCHAR(100)  OUT,
    @statuscode        INT            OUT
AS
BEGIN
    SET NOCOUNT ON;

    OPEN SYMMETRIC KEY UserDataSymmetricKey DECRYPTION BY CERTIFICATE UserDataCert;

    BEGIN TRY

    -- ── 1. Default date range ────────────────────────────────────────────────
    IF @fromDate IS NULL AND @toDate IS NULL
    BEGIN
        SET @fromDate = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
        SET @toDate   = CAST(GETDATE() AS DATE);
    END
    ELSE
    BEGIN
        IF @fromDate IS NULL  SET @fromDate = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
        IF @toDate   IS NULL  SET @toDate   = DATEADD(DAY, 1,   CAST(GETDATE() AS DATE));
    END

    -- ── 2. Timezone lookup ───────────────────────────────────────────────────
    DECLARE @TimeZoneId INT;
    SELECT @TimeZoneId = Id FROM tbl_mst_TimeZone WHERE TimeZone = @timezone;

    -- ── 3. Clean extensions ──────────────────────────────────────────────────
    IF @extensions IN ('""', '', '" ')
        SET @extensions = NULL;
    ELSE
        SET @extensions = NULLIF(REPLACE(@extensions, '"', ''), '');

    -- ── 4. Wide date range for index pre-filter (±14 h covers all TZ offsets)
    DECLARE @fromDateRaw DATETIME = DATEADD(HOUR, -14, @fromDate);
    DECLARE @toDateRaw   DATETIME = DATEADD(HOUR,  14, @toDate);

    -- ── 5. Defensive temp table cleanup ─────────────────────────────────────
    IF OBJECT_ID('tempdb..#FilterOrgWithChild')   IS NOT NULL DROP TABLE #FilterOrgWithChild;
    IF OBJECT_ID('tempdb..#OrganizationIds')       IS NOT NULL DROP TABLE #OrganizationIds;
    IF OBJECT_ID('tempdb..#OrgHierarchy')          IS NOT NULL DROP TABLE #OrgHierarchy;
    IF OBJECT_ID('tempdb..#DistinctOrganizations') IS NOT NULL DROP TABLE #DistinctOrganizations;
    IF OBJECT_ID('tempdb..#AgentIds')              IS NOT NULL DROP TABLE #AgentIds;
    IF OBJECT_ID('tempdb..#InstanceIds')           IS NOT NULL DROP TABLE #InstanceIds;
    IF OBJECT_ID('tempdb..#PlatformIds')           IS NOT NULL DROP TABLE #PlatformIds;
    IF OBJECT_ID('tempdb..#ChannelTypes')          IS NOT NULL DROP TABLE #ChannelTypes;
    IF OBJECT_ID('tempdb..#FormIds')               IS NOT NULL DROP TABLE #FormIds;
    IF OBJECT_ID('tempdb..#EvaluatorIds')          IS NOT NULL DROP TABLE #EvaluatorIds;
    IF OBJECT_ID('tempdb..#METADATA')              IS NOT NULL DROP TABLE #METADATA;
    IF OBJECT_ID('tempdb..#METADATA1')             IS NOT NULL DROP TABLE #METADATA1;

    -- ── 6. Parse all filter lists into INDEXED TEMP TABLES ──────────────────
    --      Table variables carry no statistics; temp tables do.
    CREATE TABLE #AgentIds     (AgentId      NVARCHAR(100) PRIMARY KEY);
    CREATE TABLE #FormIds      (form_id      INT           PRIMARY KEY);
    CREATE TABLE #EvaluatorIds (evaluator_id INT           PRIMARY KEY);
    CREATE TABLE #InstanceIds  (appid INT, PlatformId INT, PRIMARY KEY (appid, PlatformId));
    CREATE TABLE #PlatformIds  (PlatformId   INT           PRIMARY KEY);
    CREATE TABLE #ChannelTypes (channelType  NVARCHAR(50)  PRIMARY KEY);

    IF ISNULL(@agentNameIds, '') LIKE '%"agentsId":%'
        INSERT INTO #AgentIds (AgentId)
        SELECT DISTINCT agentsId
        FROM OPENJSON(@agentNameIds) WITH (agentsId NVARCHAR(100) '$.agentsId')
        WHERE agentsId IS NOT NULL;

    IF ISNULL(@formIds, '') <> ''
        INSERT INTO #FormIds (form_id)
        SELECT DISTINCT TRY_CAST(value AS INT)
        FROM STRING_SPLIT(@formIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

    IF ISNULL(@evaluatorIds, '') <> ''
        INSERT INTO #EvaluatorIds (evaluator_id)
        SELECT DISTINCT TRY_CAST(value AS INT)
        FROM STRING_SPLIT(@evaluatorIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

    IF ISNULL(@instanceNameIds, '') LIKE '%"appid":%'
        INSERT INTO #InstanceIds (appid, PlatformId)
        SELECT DISTINCT appid, PlatformId
        FROM OPENJSON(@instanceNameIds) WITH (appid INT '$.appid', PlatformId INT '$.PlatformId')
        WHERE appid IS NOT NULL;

    IF ISNULL(@platformIds, '') LIKE '%"PlatformId":%'
        INSERT INTO #PlatformIds (PlatformId)
        SELECT DISTINCT PlatformId
        FROM OPENJSON(@platformIds) WITH (PlatformId INT '$.PlatformId')
        WHERE PlatformId IS NOT NULL;

    IF ISNULL(@channelTypeIds, '') LIKE '%"channelType":%'
        INSERT INTO #ChannelTypes (channelType)
        SELECT DISTINCT LOWER(LTRIM(RTRIM(channelType)))
        FROM OPENJSON(@channelTypeIds) WITH (channelType NVARCHAR(50) '$.channelType')
        WHERE ISNULL(LTRIM(RTRIM(channelType)), '') <> '';

    -- ── 7. Cache org hierarchy ONCE — replaces 3 separate TVF invocations ───
    SELECT organization_id
    INTO   #OrgHierarchy
    FROM   dbo.GetOrganizationHierarchyByUser(@userId);

    CREATE CLUSTERED INDEX CIX_OrgHierarchy ON #OrgHierarchy (organization_id);

    -- ── 8. Organization filter ───────────────────────────────────────────────
    CREATE TABLE #FilterOrgWithChild (Id INT PRIMARY KEY, OrgName NVARCHAR(500), ParentId INT);
    CREATE TABLE #OrganizationIds    (organizationId INT PRIMARY KEY);

    IF ISNULL(@organizationIds, '') LIKE '%"organizationId":%'
    BEGIN
        BEGIN TRY
            INSERT INTO #OrganizationIds (organizationId)
            SELECT DISTINCT organizationId
            FROM OPENJSON(@organizationIds) WITH (organizationId INT '$.organizationId')
            WHERE organizationId IS NOT NULL AND organizationId > 0;
        END TRY
        BEGIN CATCH PRINT 'Error parsing organization JSON'; END CATCH;

        INSERT INTO #FilterOrgWithChild (Id, OrgName, ParentId)
        SELECT o.Id, o.org_name, o.parent_id
        FROM   TblMst_Organizations o
        WHERE  o.Id IN (SELECT organizationId FROM #OrganizationIds);
    END
    DROP TABLE #OrganizationIds;

    -- ── 9. DistinctOrganizations with clustered index on userId ─────────────
    SELECT DISTINCT U.userId, UA.org_id AS OrgId, Org.org_name AS organization
    INTO  #DistinctOrganizations
    FROM  TblMst_UserDetails           U   WITH (NOLOCK)
    LEFT JOIN TblMap_UserAgentOrganization UA  WITH (NOLOCK) ON UA.user_id = U.userId
    LEFT JOIN TblMst_Organizations         Org WITH (NOLOCK) ON Org.Id     = UA.org_id;

    CREATE CLUSTERED INDEX CIX_DistOrg ON #DistinctOrganizations (userId);

    -- ── 9b. Pre-aggregate org strings per user (runs once on ~285 rows) ──────
    -- Avoids STRING_AGG + fan-out GROUP BY on 100K+ Metadata rows in the main query
    SELECT userId,
           STRING_AGG(CAST(OrgId AS NVARCHAR(MAX)), ',') WITHIN GROUP (ORDER BY OrgId) AS organizationId,
           STRING_AGG(organization,                 ',') WITHIN GROUP (ORDER BY OrgId) AS organizationName
    INTO  #UserOrgs
    FROM  #DistinctOrganizations
    GROUP BY userId;

    CREATE CLUSTERED INDEX CIX_UserOrgs ON #UserOrgs (userId);

    -- ── 10. Caller role check ────────────────────────────────────────────────
    DECLARE @IsAgent BIT = 0;
    IF EXISTS (SELECT 1 FROM TblMap_UserRoles WHERE userId = @userId AND user_role_id = 4)
        SET @IsAgent = 1;

    -- ════════════════════════════════════════════════════════════════════════
    -- ACTIVE STATUS = 0  (interaction list — dynamic metadata columns)
    -- ════════════════════════════════════════════════════════════════════════
    IF @ActiveStatus = 0
    BEGIN
        -- ##METADATA_TMP is a global temp that survives sp_executesql so it can be copied
        -- to the local #METADATA with a direct statement (direct statements create proc-scoped temps).
        -- Drop any leftover from a previous aborted run before we start.
        IF OBJECT_ID('tempdb..##METADATA_TMP') IS NOT NULL DROP TABLE ##METADATA_TMP;

        DECLARE @DynamicColumns NVARCHAR(MAX) = '';
        SELECT @DynamicColumns = @DynamicColumns + ', M.' + MetadataColumn + ' AS [' + DisplayName + ']'
        FROM tbl_Systemcolumns
        WHERE Flag = 1
          AND DisplayName IS NOT NULL
          AND DisplayName <> ''
          AND LOWER(LTRIM(RTRIM(DisplayName))) <> 'channel type';

        -- Build TZ expression once so it is not repeated 4× inside the SQL string
        DECLARE @TzExpr NVARCHAR(500) =
            CASE
                WHEN @TimeZoneId IS NULL
                THEN 'M.audio_start_time'
                ELSE 'CASE WHEN ' + CAST(@TimeZoneId AS NVARCHAR)
                     + ' = M.timezone THEN M.audio_start_time ELSE dbo.CALLDATE_IN_TZFORMAT('
                     + CAST(@TimeZoneId AS NVARCHAR) + ', M.audio_start_time) END'
            END;

        DECLARE @TzEndExpr NVARCHAR(500) =
            CASE
                WHEN @TimeZoneId IS NULL
                THEN 'M.audio_end_time'
                ELSE 'CASE WHEN ' + CAST(@TimeZoneId AS NVARCHAR)
                     + ' = M.timezone THEN M.audio_end_time ELSE dbo.CALLDATE_IN_TZFORMAT('
                     + CAST(@TimeZoneId AS NVARCHAR) + ', M.audio_end_time) END'
            END;

        DECLARE @DynamicSQL NVARCHAR(MAX) = N'
        SELECT
            M.interaction_id  AS id,
            M.call_id         AS callId,
            M.ucid,
            M.ani,
            M.extension,
            ISNULL(IT.InteractionType, CAST(M.channeltype AS NVARCHAR(50))) AS [Channel Type],
            P.PlatformName    AS [Platform Name],
            ISNULL(I.InstanceName, '''')  AS [Instance Name],
            ' + @TzExpr    + ' AS audioStartTime,
            ' + @TzEndExpr + ' AS audioEndTime,
            M.personal_name   AS personalName,
            M.agent_id        AS agentId,
            ' + @TzExpr    + ' AS localStartTime,
            ' + @TzEndExpr + ' AS localEndTime,
            CASE WHEN M.direction = 0 THEN ''Inbound''
                 WHEN M.direction = 1 THEN ''Outbound''
                 ELSE ''Unknown'' END AS direction,
            M.duration,
            M.dnis_code       AS dnis,
            M.file_location   AS fileLocation,
            M.file_source_type AS fileSourceType,
            UO.organizationId,
            UO.organizationName'
            + @DynamicColumns + '
        INTO ##METADATA_TMP
        FROM TblMst_Metadata              M   WITH (NOLOCK)
        JOIN TblMst_UserDetails           usr WITH (NOLOCK) ON usr.user_login_id = M.agent_id
                                                           AND usr.DeleteStatus  <> 1
        LEFT JOIN #UserOrgs               UO                 ON UO.userId         = usr.userId
        LEFT JOIN dbo.tblmst_Platforms    P   WITH (NOLOCK) ON P.PlatformId      = M.PlatformId
        LEFT JOIN dbo.Tblmst_InteractionType IT WITH (NOLOCK) ON IT.Id = TRY_CAST(M.channeltype AS INT)
        OUTER APPLY (
            SELECT TOP 1 X.InstanceName
            FROM (
                SELECT A.InstanceName, 1 AS SortOrder
                FROM dbo.tblmst_Appsettings A WITH (NOLOCK)
                WHERE A.appid = M.appid AND A.PlatformId = M.PlatformId
                  AND ISNULL(A.InstanceName,'''') <> ''''
                UNION ALL
                SELECT V.InstanceName, 2
                FROM dbo.tblmst_SettingsVerint V WITH (NOLOCK)
                WHERE V.appid = M.appid AND V.PlatformId = M.PlatformId
                  AND ISNULL(V.InstanceName,'''') <> ''''
            ) X ORDER BY X.SortOrder
        ) I
        WHERE
            -- Narrow candidate rows via index seek BEFORE calling per-row UDF
            M.audio_start_time >= ''' + CONVERT(NVARCHAR,@fromDateRaw,120) + '''
            AND M.audio_start_time <= ''' + CONVERT(NVARCHAR,@toDateRaw,  120) + '''
            -- Exact timezone-aware filter
            AND ' + @TzExpr + ' >= ''' + CONVERT(NVARCHAR,@fromDate,120) + '''
            AND ' + @TzExpr + ' <= ''' + CONVERT(NVARCHAR,@toDate,  120) + '''
            -- Org hierarchy filter via EXISTS — no fan-out, no GROUP BY needed
            AND EXISTS (
                SELECT 1
                FROM TblMap_UserAgentOrganization ABM WITH (NOLOCK)
                JOIN #OrgHierarchy O ON O.organization_id = ABM.org_id
                WHERE ABM.user_id = usr.userId
                  AND ((SELECT COUNT(*) FROM #FilterOrgWithChild) = 0
                       OR ABM.org_id IN (SELECT Id FROM #FilterOrgWithChild))
            )
            AND (@callId  IS NULL OR M.call_id  = @callId)
            AND (@ucid    IS NULL OR M.ucid     = @ucid)
            AND (@agent   IS NULL OR M.agent_id = @agent)
            AND (
                @durationOperator IS NULL OR @durationValue IS NULL
                OR (@durationOperator = ''=''       AND M.duration =  @durationValue)
                OR (@durationOperator = ''<''       AND M.duration <  @durationValue)
                OR (@durationOperator = ''>''       AND M.duration >  @durationValue)
                OR (@durationOperator = ''<=''      AND M.duration <= @durationValue)
                OR (@durationOperator = ''>=''      AND M.duration >= @durationValue)
                OR (@durationOperator = ''between'' AND @durationValue2 IS NOT NULL
                    AND M.duration BETWEEN @durationValue AND @durationValue2)
            )
            AND (@aniDni IS NULL
                 OR M.ani       LIKE ''%'' + @aniDni + ''%''
                 OR M.dnis_code LIKE ''%'' + @aniDni + ''%'')
            AND (@extensions IS NULL OR M.extension = @extensions)
            AND (NOT EXISTS (SELECT 1 FROM #AgentIds)
                 OR usr.user_login_id IN (SELECT AgentId FROM #AgentIds))
            AND (NOT EXISTS (SELECT 1 FROM #InstanceIds)
                 OR EXISTS (SELECT 1 FROM #InstanceIds II
                            WHERE II.appid = M.appid AND II.PlatformId = M.PlatformId))
            AND (NOT EXISTS (SELECT 1 FROM #PlatformIds)
                 OR M.PlatformId IN (SELECT PlatformId FROM #PlatformIds))
            AND (NOT EXISTS (SELECT 1 FROM #ChannelTypes)
                 OR LOWER(LTRIM(RTRIM(M.channeltype))) IN (SELECT channelType FROM #ChannelTypes))
            AND (
                NOT EXISTS (SELECT 1 FROM TblMap_UserRoles R
                            WHERE R.userId = @userId AND R.user_role_id = 4)
                OR usr.userId = @userId
            )
        OPTION (RECOMPILE);';

        -- Normalize empty strings → NULL so (@param IS NULL OR col = @param) works correctly
        IF @callId           = '' SET @callId           = NULL;
        IF @ucid             = '' SET @ucid             = NULL;
        IF @agent            = '' SET @agent            = NULL;
        IF @aniDni           = '' SET @aniDni           = NULL;
        IF @extensions       = '' SET @extensions       = NULL;
        IF @durationOperator = '' SET @durationOperator = NULL;

        -- Scalar filters passed as parameters — prevents injection, improves plan caching
        EXEC sp_executesql
            @DynamicSQL,
            N'@callId NVARCHAR(50), @ucid NVARCHAR(50), @agent NVARCHAR(50),
              @durationOperator NVARCHAR(10), @durationValue INT, @durationValue2 INT,
              @aniDni NVARCHAR(50), @extensions NVARCHAR(100), @userId INT',
            @callId           = @callId,
            @ucid             = @ucid,
            @agent            = @agent,
            @durationOperator = @durationOperator,
            @durationValue    = @durationValue,
            @durationValue2   = @durationValue2,
            @aniDni           = @aniDni,
            @extensions       = @extensions,
            @userId           = @userId;

        -- Copy global temp → proc-scoped local temp (direct statement, so #METADATA lives for the proc).
        SELECT * INTO #METADATA FROM ##METADATA_TMP;
        DROP TABLE ##METADATA_TMP;

        IF @rowCountPerPage >= (SELECT COUNT(*) FROM #METADATA)
            SET @pageNo = 1;
    END

    -- ════════════════════════════════════════════════════════════════════════
    -- ACTIVE STATUS = 1  (evaluations view — static SQL, no dynamic columns)
    -- ════════════════════════════════════════════════════════════════════════
    IF @ActiveStatus = 1
    BEGIN
        CREATE TABLE #METADATA1 (
            id               INT,
            callId           NVARCHAR(50),
            audioStartTime   DATETIME,
            duration         INT,
            platformName     NVARCHAR(200),
            instanceName     NVARCHAR(200),
            user_full_name   NVARCHAR(100),
            userId           INT,
            evaluation_date  DATETIME,
            FormUniqueId     NVARCHAR(100),
            form_name        NVARCHAR(200),
            personalName     NVARCHAR(200),
            organizationName NVARCHAR(MAX),
            EvaluationCount  INT
        );

        -- Single INSERT replaces the two near-identical agent/non-agent branches.
        -- The @IsAgent flag is evaluated per-row but the query shape is identical.
        INSERT INTO #METADATA1
            (id, callId, audioStartTime, duration, platformName, instanceName,
             user_full_name, userId, evaluation_date, FormUniqueId, form_name,
             personalName, organizationName, EvaluationCount)
        SELECT
            M.interaction_id AS id,
            M.call_id        AS callId,
            CASE
                WHEN @TimeZoneId IS NULL OR @TimeZoneId = M.timezone THEN M.audio_start_time
                ELSE dbo.CALLDATE_IN_TZFORMAT(@TimeZoneId, M.audio_start_time)
            END              AS audioStartTime,
            M.duration,
            ISNULL(P.PlatformName, '')  AS platformName,
            ISNULL(I.InstanceName, '')  AS instanceName,
            CONVERT(NVARCHAR(100), DecryptByKey(evalUsr.user_full_name)) AS user_full_name,
            evalUsr.userId   AS userId,
            CASE
                WHEN @TimeZoneId IS NULL OR @TimeZoneId = M.timezone THEN FA.evaluation_date
                ELSE dbo.CALLDATE_IN_TZFORMAT(@TimeZoneId, FA.evaluation_date)
            END              AS evaluation_date,
            FA.FormUniqueId,
            f.form_name,
            M.personal_name  AS personalName,
            STRING_AGG(DO.organization, ',')
                WITHIN GROUP (ORDER BY DO.organization) AS organizationName,
            COUNT(DISTINCT CASE WHEN FA.is_evaluation_status IS NOT NULL THEN FA.id END) AS EvaluationCount
        FROM TblMst_Metadata              M    WITH (NOLOCK)
        JOIN TblMap_InteractionForm        FA   WITH (NOLOCK) ON FA.interaction_id   = M.interaction_id
        JOIN TblMst_Form                   f                   ON f.Form_id           = FA.form_id
        JOIN TblMst_UserDetails            agentUsr WITH (NOLOCK) ON agentUsr.user_login_id = M.agent_id
        JOIN TblMst_UserDetails            evalUsr  WITH (NOLOCK) ON evalUsr.userId          = FA.evaluation_by
        JOIN TblMap_UserAgentOrganization  ABM  WITH (NOLOCK) ON ABM.user_id         = agentUsr.userId
        JOIN #OrgHierarchy                 O                   ON O.organization_id   = ABM.org_id
        JOIN TblMst_Organizations          OM   WITH (NOLOCK) ON OM.Id               = O.organization_id
        LEFT JOIN #DistinctOrganizations   DO                  ON DO.userId           = agentUsr.userId
        LEFT JOIN dbo.tblmst_Platforms     P    WITH (NOLOCK) ON P.PlatformId        = M.PlatformId
        OUTER APPLY (
            SELECT TOP 1 X.InstanceName
            FROM (
                SELECT A.InstanceName, 1 AS SortOrder
                FROM dbo.tblmst_Appsettings A WITH (NOLOCK)
                WHERE A.appid = M.appid AND A.PlatformId = M.PlatformId
                  AND ISNULL(A.InstanceName,'') <> ''
                UNION ALL
                SELECT V.InstanceName, 2
                FROM dbo.tblmst_SettingsVerint V WITH (NOLOCK)
                WHERE V.appid = M.appid AND V.PlatformId = M.PlatformId
                  AND ISNULL(V.InstanceName,'') <> ''
            ) X ORDER BY X.SortOrder
        ) I
        WHERE
            agentUsr.DeleteStatus <> 1
            -- Index pre-filter on raw column before TZ UDF
            AND M.audio_start_time >= @fromDateRaw
            AND M.audio_start_time <= @toDateRaw
            -- Exact TZ-aware evaluation date filter
            AND (
                CASE WHEN @TimeZoneId IS NULL OR @TimeZoneId = M.timezone
                     THEN FA.evaluation_date
                     ELSE dbo.CALLDATE_IN_TZFORMAT(@TimeZoneId, FA.evaluation_date)
                END
            ) BETWEEN @fromDate AND @toDate
            AND ((SELECT COUNT(*) FROM #FilterOrgWithChild) = 0
                 OR OM.Id IN (SELECT Id FROM #FilterOrgWithChild))
            AND (NOT EXISTS (SELECT 1 FROM #FormIds)
                 OR FA.form_id IN (SELECT form_id FROM #FormIds))
            AND (NOT EXISTS (SELECT 1 FROM #EvaluatorIds)
                 OR FA.evaluation_by IN (SELECT evaluator_id FROM #EvaluatorIds))
            AND (@callId IS NULL OR M.call_id = @callId)
            AND (NOT EXISTS (SELECT 1 FROM #AgentIds)
                 OR agentUsr.user_login_id IN (SELECT AgentId FROM #AgentIds))
            AND (NOT EXISTS (SELECT 1 FROM #InstanceIds)
                 OR EXISTS (SELECT 1 FROM #InstanceIds II
                            WHERE II.appid = M.appid AND II.PlatformId = M.PlatformId))
            AND (NOT EXISTS (SELECT 1 FROM #PlatformIds)
                 OR M.PlatformId IN (SELECT PlatformId FROM #PlatformIds))
            AND (NOT EXISTS (SELECT 1 FROM #ChannelTypes)
                 OR LOWER(LTRIM(RTRIM(M.channeltype))) IN (SELECT channelType FROM #ChannelTypes))
            AND (
                @durationOperator IS NULL OR @durationValue IS NULL
                OR (@durationOperator = '='       AND M.duration =  @durationValue)
                OR (@durationOperator = '<'       AND M.duration <  @durationValue)
                OR (@durationOperator = '>'       AND M.duration >  @durationValue)
                OR (@durationOperator = '<='      AND M.duration <= @durationValue)
                OR (@durationOperator = '>='      AND M.duration >= @durationValue)
                OR (@durationOperator = 'between' AND @durationValue2 IS NOT NULL
                    AND M.duration BETWEEN @durationValue AND @durationValue2)
            )
            AND (@aniDni IS NULL
                 OR M.ani       LIKE '%' + @aniDni + '%'
                 OR M.dnis_code LIKE '%' + @aniDni + '%')
            -- Row-level user scope filter (replaces the two separate INSERT branches)
            AND (
                (@IsAgent = 1 AND agentUsr.userId = @userId)
                OR
                (
                    @IsAgent = 0
                    AND ((@privilegeId = 26 AND evalUsr.userId = @userId) OR @privilegeId = 27)
                    AND EXISTS (
                        SELECT 1
                        FROM TblMap_UserAgentOrganization EOrg WITH (NOLOCK)
                        JOIN #OrgHierarchy EO ON EO.organization_id = EOrg.org_id
                        WHERE EOrg.user_id = evalUsr.userId
                    )
                )
            )
        GROUP BY
            M.interaction_id, M.call_id, M.audio_start_time, M.duration, M.timezone,
            P.PlatformName, I.InstanceName,
            evalUsr.userId, evalUsr.user_full_name, FA.evaluation_date,
            FA.FormUniqueId, f.form_name, M.personal_name, agentUsr.userId
        OPTION (RECOMPILE);

        IF @rowCountPerPage >= (SELECT COUNT(*) FROM #METADATA1)
            SET @pageNo = 1;
    END

    -- ── 11. Output ───────────────────────────────────────────────────────────
    IF @querytype = 0 OR @querytype IS NULL
    BEGIN
        IF @ActiveStatus = 0
        BEGIN
            SELECT * FROM #METADATA ORDER BY localStartTime
            OFFSET (@pageNo - 1) * @rowCountPerPage ROWS
            FETCH NEXT @rowCountPerPage ROWS ONLY;
            SELECT COUNT(*) AS TotalCount FROM #METADATA;
        END
        ELSE IF @ActiveStatus = 1
        BEGIN
            SELECT * FROM #METADATA1 ORDER BY evaluation_date
            OFFSET (@pageNo - 1) * @rowCountPerPage ROWS
            FETCH NEXT @rowCountPerPage ROWS ONLY;
            SELECT COUNT(*) AS TotalCount FROM #METADATA1;
        END
    END
    ELSE IF @querytype = 1
    BEGIN
        IF @ActiveStatus = 0
            SELECT * FROM #METADATA  ORDER BY localStartTime;
        ELSE IF @ActiveStatus = 1
            SELECT * FROM #METADATA1 ORDER BY evaluation_date DESC;
    END

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSev INT            = ERROR_SEVERITY();
        -- Guaranteed cleanup on error
        IF OBJECT_ID('tempdb..#METADATA')              IS NOT NULL DROP TABLE #METADATA;
        IF OBJECT_ID('tempdb..#METADATA1')             IS NOT NULL DROP TABLE #METADATA1;
        IF OBJECT_ID('tempdb..##METADATA_TMP')         IS NOT NULL DROP TABLE ##METADATA_TMP;
        IF OBJECT_ID('tempdb..#OrgHierarchy')          IS NOT NULL DROP TABLE #OrgHierarchy;
        IF OBJECT_ID('tempdb..#DistinctOrganizations') IS NOT NULL DROP TABLE #DistinctOrganizations;
        IF OBJECT_ID('tempdb..#UserOrgs')              IS NOT NULL DROP TABLE #UserOrgs;
        IF OBJECT_ID('tempdb..#FilterOrgWithChild')    IS NOT NULL DROP TABLE #FilterOrgWithChild;
        IF OBJECT_ID('tempdb..#AgentIds')              IS NOT NULL DROP TABLE #AgentIds;
        IF OBJECT_ID('tempdb..#InstanceIds')           IS NOT NULL DROP TABLE #InstanceIds;
        IF OBJECT_ID('tempdb..#PlatformIds')           IS NOT NULL DROP TABLE #PlatformIds;
        IF OBJECT_ID('tempdb..#ChannelTypes')          IS NOT NULL DROP TABLE #ChannelTypes;
        IF OBJECT_ID('tempdb..#FormIds')               IS NOT NULL DROP TABLE #FormIds;
        IF OBJECT_ID('tempdb..#EvaluatorIds')          IS NOT NULL DROP TABLE #EvaluatorIds;
        CLOSE SYMMETRIC KEY UserDataSymmetricKey;
        RAISERROR(@ErrMsg, @ErrSev, 1);
        RETURN;
    END CATCH

    -- ── 12. Normal cleanup ───────────────────────────────────────────────────
    IF OBJECT_ID('tempdb..#METADATA')              IS NOT NULL DROP TABLE #METADATA;
    IF OBJECT_ID('tempdb..#METADATA1')             IS NOT NULL DROP TABLE #METADATA1;
    IF OBJECT_ID('tempdb..##METADATA_TMP')         IS NOT NULL DROP TABLE ##METADATA_TMP;
    IF OBJECT_ID('tempdb..#OrgHierarchy')          IS NOT NULL DROP TABLE #OrgHierarchy;
    IF OBJECT_ID('tempdb..#DistinctOrganizations') IS NOT NULL DROP TABLE #DistinctOrganizations;
    IF OBJECT_ID('tempdb..#UserOrgs')              IS NOT NULL DROP TABLE #UserOrgs;
    IF OBJECT_ID('tempdb..#FilterOrgWithChild')    IS NOT NULL DROP TABLE #FilterOrgWithChild;
    IF OBJECT_ID('tempdb..#AgentIds')              IS NOT NULL DROP TABLE #AgentIds;
    IF OBJECT_ID('tempdb..#InstanceIds')           IS NOT NULL DROP TABLE #InstanceIds;
    IF OBJECT_ID('tempdb..#PlatformIds')           IS NOT NULL DROP TABLE #PlatformIds;
    IF OBJECT_ID('tempdb..#ChannelTypes')          IS NOT NULL DROP TABLE #ChannelTypes;
    IF OBJECT_ID('tempdb..#FormIds')               IS NOT NULL DROP TABLE #FormIds;
    IF OBJECT_ID('tempdb..#EvaluatorIds')          IS NOT NULL DROP TABLE #EvaluatorIds;

    SET @outputmsg  = 'Success';
    SET @statuscode = 200;

    CLOSE SYMMETRIC KEY UserDataSymmetricKey;
END
GO
