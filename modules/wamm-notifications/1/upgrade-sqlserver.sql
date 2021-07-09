IF NOT EXISTS ( SELECT  *
                FROM    sys.schemas
                WHERE   name = 'wamm_notifications' )
    EXEC('CREATE SCHEMA [wamm_notifications]');
GO
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [wamm_notifications].[Alert](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Content] [nvarchar](200) NOT NULL,
	[ClickAction] [int] NOT NULL,
	[ClickInfo] [nvarchar](75) NOT NULL,
	[Viewed] [bit] NOT NULL,
	[Timestamp] [datetime] NULL,
 CONSTRAINT [FK_wamm_Alert_User] FOREIGN KEY (UserId) REFERENCES dbo.[User](Id),
 CONSTRAINT [PK_wamm_Alert] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

IF OBJECT_ID('wamm_notifications.udf_GetAlerts') IS NOT NULL
DROP FUNCTION [wamm_notifications].udf_GetAlerts
GO
CREATE FUNCTION [wamm_notifications].udf_GetAlerts(@UserId int)
RETURNS @ResultTable TABLE (Id int, Content NVARCHAR(200), ClickAction int, ClickInfo NVARCHAR(75), Viewed bit, [Timestamp] datetime)
AS BEGIN
INSERT INTO @ResultTable
	
	select Alert.Id, Alert.Content, Alert.ClickAction, Alert.ClickInfo, Alert.Viewed, Alert.[Timestamp]
	from wamm_notifications.[Alert] Alert
		left join dbo.[User] [User] on ([User].id = Alert.UserId)
	where Alert.UserId = @UserId
		and ([User].Deleted = 0 and [User].Active = 1)

RETURN
END