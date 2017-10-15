using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Diary.Data;
using Diary.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Threading.Tasks;

namespace Diary
{
    public class Startup
    {
        public static IConfigurationRoot Configuration { get; private set; }

        public static string UrlPrefix => !string.IsNullOrEmpty(Configuration["url_path_prefix"]) ? "/" + Configuration["url_path_prefix"] : "";

        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(Configuration.GetConnectionString("DefaultConnection")));

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            // Require login by default.
            services.AddMvc(options => options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));

            // Set the login URL.
            services.Configure<IdentityOptions>(options =>
            {
                // Password settings
                options.Password.RequireDigit = false;
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(20);
                options.Lockout.MaxFailedAccessAttempts = 5;

                // Login/logout redirection
                Func<CookieRedirectContext, Task> redirect_scheme_and_host_fixer = context => 
                {
                    if (!string.IsNullOrEmpty(Configuration["redirect_scheme_and_host"]))
                        context.RedirectUri = Configuration["redirect_scheme_and_host"] + new Uri(context.RedirectUri).PathAndQuery;
                    context.Response.Redirect(context.RedirectUri);
                    return Task.CompletedTask;
                };
                ((Action<CookieAuthenticationOptions>)(copt =>
                {
                    copt.ExpireTimeSpan = TimeSpan.FromDays(20);
                    copt.LoginPath = $"{UrlPrefix}/Account/LogIn";
                    copt.LogoutPath = $"{UrlPrefix}/Account/LogOut";
                    copt.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = redirect_scheme_and_host_fixer,
                        OnRedirectToLogout = redirect_scheme_and_host_fixer
                    };
                }))(options.Cookies.ApplicationCookie);

                // User settings
                options.User.RequireUniqueEmail = true;
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
                app.UseBrowserLink();
            } else
                app.UseExceptionHandler("/Home/Error");

            app.UseStaticFiles(UrlPrefix);

            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {
                var context = serviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                context.Database.Migrate();
            }

            app.UseIdentity();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: (Configuration["url_path_prefix"] ?? "") + "/{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
