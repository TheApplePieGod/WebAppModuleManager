using System;
using System.ComponentModel.DataAnnotations;

namespace WammNotifications
{
    public class GetAlertsResult
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string Content { get; set; }
        [Required]
        public int ClickAction { get; set; }
        [Required]
        public string ClickInfo { get; set; }
        [Required]
        public bool Viewed { get; set; }
        [Required]
        public DateTime Timestamp { get; set; }
    }
}
