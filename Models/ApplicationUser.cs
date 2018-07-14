using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Diary.Models
{
    // Add profile data for application users by adding properties to the ApplicationUser class
    public class ApplicationUser
    {
        public ApplicationUser()
        {
            Entries = new HashSet<DiaryEntry>();
        }

        public string Id { get; set; }

        [Required]
        [MaxLength(256)]
        public string Email { get; set; }

        [Required]
        [MaxLength(50)]
        public string DisplayName { get; set; }

        public virtual ICollection<DiaryEntry> Entries { get; set; }
    }
}
