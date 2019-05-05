using Diary.Data;
using Diary.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace Diary.Services
{
    /// <summary>
    /// Clean up orphaned images periodically. We used to do this with a cron job but cron is not convenient in Docker containers.
    /// </summary>
    public class ImageCleaner
    {
        ILogger<ImageCleaner> _log;
        IConfiguration _config;
        IServiceScopeFactory _factory;
        string _imageBaseDir;

        public ImageCleaner(ILogger<ImageCleaner> log, IConfiguration config, IServiceScopeFactory factory)
        {
            this._log = log;
            this._config = config;
            this._factory = factory;
            this._imageBaseDir = GetImageBaseDir(config);
        }

        /// <summary>
        /// Get the image base directory from the image_dir setting, or default to ~/Diary/images.
        /// </summary>
        public static string GetImageBaseDir(IConfiguration config)
        {
            string result = config["image_dir"];
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
                    // Do this daily.
                    Thread.Sleep(TimeSpan.FromDays(1));
                    try
                    {
                        using (IServiceScope scope = _factory.CreateScope())
                            CleanUp(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>());
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

        void CleanUp(ApplicationDbContext ef)
        {
            DirectoryInfo base_dir = new DirectoryInfo(_imageBaseDir);
            foreach (DirectoryInfo subdir in base_dir.EnumerateDirectories())
            {
                foreach (FileInfo file in subdir.EnumerateFiles())
                {
                    if (file.CreationTimeUtc >= DateTime.UtcNow.AddDays(-1))
                        // Don't mess with files created in the last day, in case the entry just hasn't been saved yet.
                        continue;

                    string prefix = _config.GetUrlPrefix();
                    string required_src = $"src=\"{(prefix + "/Image/Index/").Substring(1)}{file.Name}\"";
                    if (!(ef.DiaryEntries.Any(d =>
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
