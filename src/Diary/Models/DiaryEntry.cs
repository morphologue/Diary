using System;
using System.ComponentModel.DataAnnotations;

namespace Diary.Models
{
    public class DiaryEntry
    {
        [Key]
        public int EntryID { get; set; }

        public string ApplicationUserID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        public DateTime Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string Location { get; set; }

        [Required]
        public string Body { get; set; }

        public virtual ApplicationUser ApplicationUser { get; set; }
    }
}
