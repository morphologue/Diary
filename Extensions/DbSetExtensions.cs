using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Diary.Models;
using Microsoft.EntityFrameworkCore;

namespace Diary.Extensions
{
    public static class DbSetExtensions
    {
        public static Task<ApplicationUser> FromClaimsAsync(this DbSet<ApplicationUser> dbs, IEnumerable<Claim> claims) =>
            dbs.FindAsync(claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value);
    }
}
