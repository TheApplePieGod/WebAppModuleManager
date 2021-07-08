using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using ~{dbcontext}~;

namespace WammNotifications
{
	public static class Utils
	{
		public static void CreateAlert(~{dbcontextname}~ dbContext, int UserId, string Content, int ClickAction, string ClickInfo)
		{
			var alert = new Alert
			{
				UserId = UserId,
				Content = Content,
				ClickAction = ClickAction,
				ClickInfo = ClickInfo,
				Viewed = false,
				Timestamp = DateTime.UtcNow
			};
			dbContext.Alerts.Add(alert);
		}

		public static async Task<List<GetAlertsResult>> GetAlerts(~{dbcontextname}~ dbContext, int userId)
		{
			var result = dbContext.AlertsQueryModel.FromSqlRaw(@"select * from udf_GetAlerts(@userid)",
				new SqlParameter("@userid", userId)
			);
			List<GetAlertsResult> returnList = await result.ToListAsync();
			List<GetAlertsResult> finalList = new List<GetAlertsResult>();

			foreach (GetAlertsResult alert in returnList)
			{
				if (alert.Viewed)
				{
					DateTime CurrentTime = DateTime.UtcNow;
					TimeSpan TimeDifference = (CurrentTime - alert.Timestamp);
					if (TimeDifference.TotalDays > 30)
						dbContext.Alerts.Remove(dbContext.Alerts.Where(a => a.Id == alert.Id).FirstOrDefault());
					else
						finalList.Add(alert);
				}
				else
				{
					alert.Viewed = true;
					dbContext.Alerts.Where(a => a.Id == alert.Id).FirstOrDefault().Viewed = true;
					finalList.Add(alert);
				}
			}

			finalList = finalList.OrderByDescending(e => e.Timestamp).ToList();

			await dbContext.SaveChangesAsync();
			return finalList;
		}

		public static async Task<int> GetAlertsCount(~{dbcontextname}~ dbContext, int userId)
		{
			var result = await dbContext.Alerts.Where(a => a.UserId == userId && !a.Viewed).CountAsync();
			return result;
		}

		public static async Task<bool> ClearAlert(~{dbcontextname}~ dbContext, int AlertId, int userId)
		{
			var foundAlert = dbContext.Alerts.Where(a => a.UserId == userId && a.Id == AlertId).FirstOrDefault();
			if (foundAlert != null)
			{
				dbContext.Alerts.Remove(foundAlert);
				await dbContext.SaveChangesAsync();
				return true;
			}
			else
				return false;
		}
	}
}