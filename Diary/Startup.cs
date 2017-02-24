using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Diary.Startup))]
namespace Diary
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
