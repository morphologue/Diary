using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Diary.Models;
using Diary.Models.AccountViewModels;
using Diary.Services;
using Morphologue.IdentityWsClient;
using Diary.Extensions;
using System.Net.Http;
using System.Net;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Diary.Data;

namespace Diary.Controllers
{
    public class AccountController : Controller
    {
        private readonly IdentityWs _identity;
        private readonly ILogger _logger;
        private readonly EmailSender _emailSender;
        private readonly ApplicationDbContext _db;

        public AccountController(
            IdentityWs identity,
            ILoggerFactory loggerFactory,
            EmailSender emailSender,
            ApplicationDbContext db)
        {
            _identity = identity;
            _logger = loggerFactory.CreateLogger<AccountController>();
            _emailSender = emailSender;
            _db = db;
        }

        //
        // GET: /Account/Login
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        //
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            if (ModelState.IsValid)
            {
                Alias alias = await _identity.GetAliasAsync(model.Email);
                Client client = alias == null ? null : (await alias.GetClientAsync(Constants.IdentityWsClientName));
                if (client == null)
                {
                    ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                    return View(model);
                }

                return (await DoLoginAsync(model, client)) ?? RedirectToLocal(returnUrl);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/Register
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Register(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        //
        // POST: /Account/Register
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            if (ModelState.IsValid)
            {
                // Add the user in the DB.
                ApplicationUser user = new ApplicationUser
                {
                    Email = model.Email,
                    DisplayName = model.DisplayName
                };
                try
                {
                    _db.Users.Add(user);
                    await _db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Attempting to create ApplicationUser {Email}", model.Email);
                    ModelState.AddModelError(string.Empty, "The email address is not available.");
                    return View(model);
                }

                // Add the Alias in IdentityWs.
                Alias alias;
                bool existing_alias;
                try
                {
                    alias = await _identity.GetAliasAsync(model.Email);
                    if (alias == null)
                    {
                        alias = await _identity.CreateAliasAsync(model.Email, model.Password);
                        if (alias == null)
                        {
                            return View("Error");
                        }
                        existing_alias = false;
                    }
                    else
                    {
                        if ((await alias.GetClientAsync(Constants.IdentityWsClientName)) != null)
                        {
                            ModelState.AddModelError(string.Empty, "The account already exists.");
                            return View(model);
                        }
                        existing_alias = true;
                    }
                }
                catch (IdentityException ex)
                {
                    _db.Users.Remove(user);
                    await _db.SaveChangesAsync();
                    ModelState.AddModelError(string.Empty, ex.Message);
                    return View(model);
                }
                catch (Exception ex)
                {
                    _db.Users.Remove(user);
                    await _db.SaveChangesAsync();
                    _logger.LogError(ex, "Attempting to register new Alias {Email}", model.Email);
                    ModelState.AddModelError(string.Empty, "An error occurred");
                    return View(model);
                }

                // On the home strech now: add the client in IdentityWs and create login cookie.
                Client client = await alias.CreateClientAsync(Constants.IdentityWsClientName, new Dictionary<string, string>
                {
                    ["ApplicationUserID"] = user.Id
                });
                IActionResult error_result = await DoLoginAsync(model, client, existing_alias);
                if (error_result != null)
                {
                    _db.Users.Remove(user);
                    await _db.SaveChangesAsync();
                    await client.DeleteAsync();
                    return error_result;
                }

                // Send the confirmation email.
                if (!alias.IsConfirmationTokenLoaded)
                {
                    await alias.FetchConfirmationTokenAsync();
                }
                string ctoken = alias.ConfirmationToken;
                string callbackUrl = Url.Action("ConfirmEmail", "Account", new { userId = user.Id, code = ctoken });
                await _emailSender.SendLinkAsync(user, callbackUrl, EmailReason.NewRegistration);

                _logger.LogInformation(3, "User created a new account with password.");
                return RedirectToLocal(returnUrl);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // POST: /Account/LogOff
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LogOff()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            _logger.LogInformation(4, "User logged out.");
            return RedirectToAction(nameof(HomeController.Index), "Home");
        }

        // GET: /Account/ConfirmEmail
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail(string userId, string code)
        {
            ApplicationUser user = await _db.Users.FindAsync(userId);
            Alias alias = await _identity.GetAliasAsync(user?.Email ?? string.Empty);
            if (alias == null)
            {
                return View("Error");
            }

            try
            {
                await alias.ConfirmAsync(code);
                return View("ConfirmEmail");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Confirming alias {Email}", user.Email);
            }
            return View("Error");
        }

        //
        // GET: /Account/ForgotPassword
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        //
        // POST: /Account/ForgotPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (ModelState.IsValid)
            {
                Alias alias = await _identity.GetAliasAsync(model.Email);
                Client client = alias == null ? null : (await alias.GetClientAsync(Constants.IdentityWsClientName));
                ApplicationUser user = await _db.Users.FindAsync(client?.Data["ApplicationUserID"] ?? string.Empty);
                if (user == null)
                {
                    return View("Error");
                }

                // Send the unlock email.
                string ctoken = await alias.GenerateResetTokenAsync();
                string callbackUrl = Url.Action("ResetPassword", "Account", new { userId = user.Id, code = ctoken });
                await _emailSender.SendLinkAsync(user, callbackUrl, EmailReason.ForgottenPassword);

                // Don't show anything different for a nonexistent or unconfirmed user.
                return View("ForgotPasswordConfirmation");
            }

            // If we got this far, something failed, so redisplay the form.
            return View(model);
        }

        //
        // GET: /Account/ForgotPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        //
        // GET: /Account/ResetPassword
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ResetPassword(string code = null)
        {
            return code == null ? View("Error") : View();
        }

        //
        // POST: /Account/ResetPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            Alias alias = await _identity.GetAliasAsync(model.Email);
            Client client = alias == null ? null : (await alias.GetClientAsync(Constants.IdentityWsClientName));
            ApplicationUser user = await _db.Users.FindAsync(client?.Data["ApplicationUserID"] ?? string.Empty);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return RedirectToAction(nameof(AccountController.ResetPasswordConfirmation), "Account");
            }

            try
            {
                await alias.ChangePasswordViaResetTokenAsync(model.Code, model.Password);
                return RedirectToAction(nameof(AccountController.ResetPasswordConfirmation), "Account");
            }
            catch (IdentityException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Attempting to reset via token for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "An error occurred");
                return View(model);
            }
        }

        //
        // GET: /Account/ResetPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ResetPasswordConfirmation()
        {
            return View();
        }

        #region Helpers

        private async Task<IActionResult> DoLoginAsync<T>(T model, Client client, bool existing_alias = false) where T : ICausesLogin
        {
            try
            {
                await client.LogIn(model.Password);
                ClaimsPrincipal principal = new ClaimsPrincipal(new[] { new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, client.Data["ApplicationUserID"]) }) });
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe
                });
                _logger.LogInformation(1, "User logged in.");
                return null;
            }
            catch (IdentityException ex)
            {
                if (ex.StatusCode == HttpStatusCode.ServiceUnavailable)
                {
                    _logger.LogWarning(2, "User account locked out.");
                    return View("Lockout");
                }
                ModelState.AddModelError(string.Empty, existing_alias ? "Password must match that of other applications on this server."
                    : "Invalid login attempt.");
                return View(model);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Attempting to log in Alias {Email}", model.Email);
                return View(model);
            }
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Home");
            }
        }

        #endregion
    }
}
