using Diary.Data;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace Diary
{
    /// <summary>
    /// Clean up orphaned images periodically. We used to do this with a cron job but cron is not convenient in Docker containers.
    /// </summary>
    public class ImageCleaner
    {
        ILogger<ImageCleaner> _log;
        ApplicationDbContext _ef;
        string _imageBaseDir;

        public ImageCleaner(ILoggerFactory loggerFactory, ApplicationDbContext ef)
        {
            this._log = loggerFactory.CreateLogger<ImageCleaner>();
            this._ef = ef;
            this._imageBaseDir = GetImageBaseDir();
        }

        /// <summary>
        /// Get the image base directory from the image_dir setting, or default to ~/Diary/images.
        /// </summary>
        public static string GetImageBaseDir()
        {
            string result = Startup.Configuration["image_dir"];
            if (string.IsNullOrEmpty(result))
            {
                string home = Environment.GetEnvironmentVariable(RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "LocalAppData" : "HOME");
                result = Path.Combine(home, "Diary", "images");
            }
            return result;
        }

        /// <summary>The main loop of the ImageCleaner</summary>
        public void ThreadMain()
        {
            try
            {
                while (true)
                {
                    // Do this hourly.
                    Thread.Sleep(TimeSpan.FromHours(1));
                    try
                    {
                        CleanUp();
                        _log.LogInformation("Successfully cleaned up orphaned images.");
                    }
                    catch (Exception e)
                    {
                        _log.LogError($"Exception caught while attempting to clean up images", e);
                    }
                }
            }
            catch (Exception e)
            {
                _log.LogCritical($"{nameof(ImageCleaner)}.{nameof(ThreadMain)} will exit due to unhandled exception", e);
            }
        }

        void CleanUp()
        {
            DirectoryInfo base_dir = new DirectoryInfo(_imageBaseDir);
            foreach (DirectoryInfo subdir in base_dir.EnumerateDirectories())
            {
                foreach (FileInfo file in subdir.EnumerateFiles())
                {
                    if (file.CreationTimeUtc >= DateTime.UtcNow.AddDays(-1))
                        // Don't mess with files created in the last day, in case the entry just hasn't been saved yet.
                        continue;

                    string required_src = $"src=\"{(Startup.UrlPrefix + "/Image/Index/").Substring(1)}{file.Name}\"";
                    if (!(_ef.DiaryEntries.Any(d =>
                            d.ApplicationUserID == subdir.Name
                            && d.Body.Contains(required_src))))
                        file.Delete();
                }
                if (!subdir.EnumerateFiles().Any())
                    // If there are no files left in the directory, remote it too.
                    subdir.Delete();
            }

        }
    }
}
