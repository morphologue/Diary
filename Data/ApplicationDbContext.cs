using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Diary.Models;

namespace Diary.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUser>()
                .HasMany(e => e.Entries)
                .WithOne(e => e.ApplicationUser)
                .HasForeignKey(e => e.ApplicationUserID)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public DbSet<ApplicationUser> Users { get; set; }

        public DbSet<DiaryEntry> DiaryEntries { get; set; }
    }
}
