using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ~{userlocation}~;

#nullable disable

namespace WammNotifications
{
    [Table("Alert")]
    public partial class Alert
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        [Required]
        [StringLength(200)]
        public string Content { get; set; }
        public int ClickAction { get; set; }
        [Required]
        [StringLength(75)]
        public string ClickInfo { get; set; }
        public bool Viewed { get; set; }
        [Column(TypeName = "datetime")]
        public DateTime? Timestamp { get; set; }

        [ForeignKey(nameof(UserId))]
        [InverseProperty("Alerts")]
        public virtual User User { get; set; }
    }
}
