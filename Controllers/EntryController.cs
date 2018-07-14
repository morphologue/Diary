using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Diary.Models;
using Microsoft.Extensions.Logging;
using Diary.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using HtmlAgilityPack;
using System.Net;
using System.Security.Claims;

namespace Diary.Controllers
{
    public class EntryController : Controller
    {
        readonly ILogger _logger;
        readonly ApplicationDbContext _ef;

        public object SqlFunctions { get; private set; }

        public EntryController(ILoggerFactory loggerFactory, ApplicationDbContext ef)
        {
            _logger = loggerFactory.CreateLogger<AccountController>();
            _ef = ef;
        }

        public async Task<IActionResult> Index(int? last_id, string search_text, int batch_size = 50)
        {
            // Adjust batch size to sane defaults.
            if (batch_size < 1)
                batch_size = 1;
            if (batch_size > 100)
                batch_size = 100;

            // Construct the base query.
            string user_id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            IQueryable<DiaryEntry> query = _ef.DiaryEntries.Where(e => e.ApplicationUserID == user_id);

            // Apply search filter if provided.
            if (!string.IsNullOrWhiteSpace(search_text))
                query = query.Where(e => e.Title.Contains(search_text)
                    || e.Date.Contains(search_text)
                    || e.Location.Contains(search_text)
                    || e.Body.Contains(search_text));

            // Only include entries "older" than that with last_id.
            if (last_id.HasValue)
            {
                DiaryEntry last_entry = await _ef.DiaryEntries
                    .Where(e => e.EntryID == last_id.Value && e.ApplicationUserID == user_id)
                    .FirstOrDefaultAsync();
                if (last_entry != null) {
                    string last_date = last_entry.Date;
                    query = query.Where(e => string.Compare(e.Date, last_date) < 0 || (e.Date == last_date && e.EntryID < last_id.Value));
                }
            }

            // Go to the DB.
            List<DiaryEntry> entries = await query
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.EntryID)
                .Take(batch_size + 1)
                .ToListAsync();

            // Format the results.
            return Json(new Dictionary<string, object>()
            {
                ["entries"] = entries
                    .Take(batch_size)
                    .Select(e => new Dictionary<string, object>()
                    {
                        ["key"] = e.EntryID,
                        ["title"] = e.Title,
                        ["date"] = e.Date,
                        ["location"] = e.Location,
                        ["body"] = e.Body,
                        ["textSummary"] = SanitiseAndElipsise(e.Body)
                    }),
                ["serverEmpty"] = entries.Count <= batch_size
            });
        }

        [ActionName("Index")]
        [HttpPut]
        public async Task<IActionResult> IndexPut(int? id, [FromBody] [Bind("Title", "Date", "Location", "Body")] DiaryEntry put_entry)
        {
            DateTime unused;
            if (!ModelState.IsValid || !DateTime.TryParseExact(put_entry.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out unused))
            {
                _logger.LogError($"ModelState: {string.Join(", ", ModelState.Keys)}, Date: {put_entry.Date}");
                return BadRequest();
            }

            if (id.HasValue)
            {
                // Update existing entry.
                string user_id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
                DiaryEntry db_entry = await _ef.DiaryEntries
                    .Where(e => e.EntryID == id.Value && e.ApplicationUserID == user_id)
                    .FirstOrDefaultAsync();
                if (db_entry == null)
                    return NotFound();
                db_entry.Title = put_entry.Title;
                db_entry.Date = put_entry.Date;
                db_entry.Location = put_entry.Location;
                db_entry.Body = put_entry.Body;
                await _ef.SaveChangesAsync();
                return Ok();
            }
            else
            {
                // Create new entry.
                string user_id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
                _ef.DiaryEntries.Add(put_entry);
                await _ef.SaveChangesAsync();
                return Created(Url.Action("Index"), Json(new { key = put_entry.EntryID }));
            }
        }

        [ActionName("Index")]
        [HttpDelete]
        public async Task<IActionResult> IndexDelete(int id)
        {
            string user_id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            DiaryEntry db_entry = await _ef.DiaryEntries
                .Where(e => e.EntryID == id && e.ApplicationUserID == user_id)
                .FirstOrDefaultAsync();
            if (db_entry == null)
                return NotFound();
            _ef.DiaryEntries.Remove(db_entry);
            await _ef.SaveChangesAsync();
            return Ok();
        }

        /// <summary>Strip all the HTML tags and return the leftmost 200 characters, ending with an elipsis if we would have otherwise returned more.
        /// If the original HTML was no blank but it becomes blank after stripping the HTML tag, return "[Markup]": it's probably an image. We need to
        /// do this on the server when GETting a batch of entries, otherwise the sanitising process causes the browser to load all embedded images in
        /// advance, as a side-effect (ouch!).</summary>
        /// <param name="html"></param>
        static string SanitiseAndElipsise(string html)
        {
            const int MAX_LENGTH = 200;
            const string ELIPSIS = "...";

            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(html);
            string stripped = WebUtility.HtmlDecode(doc.DocumentNode.InnerText).Trim();

            if (html.Trim().Length > 0 && stripped.Length == 0)
                return "[Markup]";

            if (stripped.Length <= MAX_LENGTH)
                return stripped;

            return stripped.Substring(0, MAX_LENGTH - ELIPSIS.Length) + ELIPSIS;
        }
    }
}
