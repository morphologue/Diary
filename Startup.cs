using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Diary.Data;
using Diary.Extensions;
using Diary.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Morphologue.IdentityWsClient;

namespace Diary
{
    public class Startup
    {
        private IConfiguration Configuration { get; set; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton(Configuration);
            services.AddSingleton<ImageCleaner>();
            services.AddSingleton<EmailSender>();
            services.AddDbContext<ApplicationDbContext>(options => options.UseMySql(Configuration.GetConnectionString("DefaultConnection")));
            services.AddHttpClient<IdentityWs>(http => http.BaseAddress = new Uri(Configuration["identityws_base_url"]));

            // Cookie authentication
            Task redirect_scheme_and_host_fixer(RedirectContext<CookieAuthenticationOptions> context)
            {
                context.RedirectUri = Configuration["redirect_scheme_and_host"] + new Uri(context.RedirectUri).PathAndQuery;
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            }
            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(copt =>
                {
                    copt.ExpireTimeSpan = TimeSpan.FromDays(20);
                    copt.LoginPath = $"{Configuration.GetUrlPrefix()}/Account/LogIn";
                    copt.LogoutPath = $"{Configuration.GetUrlPrefix()}/Account/LogOut";
                    copt.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = redirect_scheme_and_host_fixer,
                        OnRedirectToLogout = redirect_scheme_and_host_fixer
                    };
                });

            // Require authorization by default.
            services.AddMvc(options => options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireClaim(ClaimTypes.Name).Build())))
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ImageCleaner cleaner)
        {
            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();
            else
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseStaticFiles(Configuration.GetUrlPrefix());
            app.UseAuthentication();
            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: (Configuration["url_path_prefix"] ?? "") + "/{controller=Home}/{action=Index}/{id?}");
            });

            // Start a thread to clean up orphaned images periodically.
            Thread cleaner_thread = new Thread(() => cleaner.ThreadMain());
            cleaner_thread.IsBackground = true;
            cleaner_thread.Name = "ImageCleaner";
            cleaner_thread.Start();

            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {
                // Apply DB migrations, if any.
                var context = serviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                context.Database.Migrate();
            }
        }
    }
}
