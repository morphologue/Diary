using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        // Encode the date as a string so that it can be searched easily.
        [Column(TypeName = "char(10)")]
        [Required]
        [MaxLength(10)]
        public string Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string Location { get; set; }

        [Required]
        public string Body { get; set; }

        public virtual ApplicationUser ApplicationUser { get; set; }
    }
}
