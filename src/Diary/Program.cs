using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace Diary
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = new WebHostBuilder()
                .UseKestrel()
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .UseUrls("http://localhost:51407")
                .Build();

            host.Run();
        }
    }
}
