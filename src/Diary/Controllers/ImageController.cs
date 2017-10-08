using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;
using Diary.Models;

namespace Diary.Controllers
{
    public class ImageController : Controller
    {
        static readonly Dictionary<string, string> extensionContentTypes = new Dictionary<string, string>()
        {
            [".jpg"] = "image/jpeg",
            [".gif"] = "image/gif",
            [".png"] = "image/png"
        };

        readonly ILogger _logger;
        readonly UserManager<ApplicationUser> _userManager;
        readonly string imageBaseDir;

        public ImageController(UserManager<ApplicationUser> userManager, ILoggerFactory loggerFactory)
        {
            _userManager = userManager;
            _logger = loggerFactory.CreateLogger<AccountController>();

            // Get the image base directory from the image_dir setting, or default to ~/Diary/images.
            imageBaseDir = Startup.Configuration["image_dir"];
            if (string.IsNullOrEmpty(imageBaseDir))
            {
                string home = Environment.GetEnvironmentVariable(RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "LocalAppData" : "Home");
                imageBaseDir = Path.Combine(home, "Diary", "images");
            }
        }

        public async Task<IActionResult> Index(string id)
        {
            string extension = GetAndValidateExtension(id);
            if (extension == null)
                return NotFound(404);

            string name = Path.GetFileNameWithoutExtension(id);
            Guid unused;
            if (!Guid.TryParse(name, out unused))
            {
                _logger.LogError($"File name '{name}' is not a GUID");
                return NotFound();
            }

            string server_path = Path.Combine(imageBaseDir, (await _userManager.GetUserAsync(User)).Id, id);

            try
            {
                return File(new FileStream(server_path, FileMode.Open), extensionContentTypes[extension]);
            }
            catch (FileNotFoundException)
            {
                return NotFound();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                return StatusCode(500);
            }
        }

        public async Task<IActionResult> Upload(IFormFile file)
        {
            string extension = GetAndValidateExtension(file.FileName);
            if (extension == null)
                return BadRequest();

            // Determine the server path in a directory specific to this user and make sure the directory exists.
            string file_name = $"{Guid.NewGuid()}{extension}";
            string dir = Path.Combine(imageBaseDir, (await _userManager.GetUserAsync(User)).Id);
            Directory.CreateDirectory(dir);
            string server_path = Path.Combine(dir, file_name);

            // Write out the file.
            using (FileStream fs = new FileStream(server_path, FileMode.Create))
                await file.CopyToAsync(fs);

            // Let the client know how to access it.
            return Json(new { location = Url.Action("Index", new { id = file_name }) });
        }

        string GetAndValidateExtension(string file_name)
        {
            string extension = Path.GetExtension(file_name);
            if (string.IsNullOrEmpty(extension))
            {
                _logger.LogError($"Missing extension on image file '{file_name}'");
                return null;
            }
            if (!extensionContentTypes.ContainsKey(extension))
            {
                _logger.LogError($"Unknown image file extension '{extension}'");
                return null;
            }
            return extension;
        }
    }
}
