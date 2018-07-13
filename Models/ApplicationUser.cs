using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Diary.Models
{
    // Add profile data for application users by adding properties to the ApplicationUser class
    public class ApplicationUser : IdentityUser
    {
        public ApplicationUser() : base()
        {
            Entries = new HashSet<DiaryEntry>();
        }

        [Required]
        [MaxLength(50)]
        public string DisplayName { get; set; }

        public virtual ICollection<DiaryEntry> Entries { get; set; }
    }
}
