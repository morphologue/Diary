using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Diary.Models;
using Diary.Models.ManageViewModels;
using Diary.Extensions;
using Morphologue.IdentityWsClient;
using Diary.Data;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System;

namespace Diary.Controllers
{
    public class ManageController : Controller
    {
        private readonly IdentityWs _identity;
        private readonly ILogger _logger;
        private readonly ApplicationDbContext _db;

        public ManageController(
        IdentityWs identity,
        ILoggerFactory loggerFactory,
        ApplicationDbContext db)
        {
            _identity = identity;
            _logger = loggerFactory.CreateLogger<ManageController>();
            _db = db;
        }

        //
        // GET: /Manage/Index
        [HttpGet]
        public IActionResult Index(ManageMessageId? message = null)
        {
            ViewBag.StatusMessage =
                message == ManageMessageId.ChangePasswordSuccess ? "Your password has been changed."
                : message == ManageMessageId.Error ? "An error has occurred."
                : "";

            return View();
        }

        //
        // GET: /Manage/DeleteAccount
        public ActionResult DeleteAccount()
        {
            return View();
        }

        //
        // POST: /Manage/DeleteAccount
        [HttpPost]
        [ValidateAntiForgeryToken]
        [ActionName("DeleteAccount")]
        public async Task<ActionResult> DeleteAccountPost()
        {
            // Remove from the database.
            ApplicationUser user = await _db.Users.FromClaimsAsync(User.Claims);
            if (user == null)
            {
                return View("Error");
            }
            _db.Remove(user);
            await _db.SaveChangesAsync();

            // Remove from IdentityWs.
            Alias alias = await _identity.GetAliasAsync(user.Email);
            Client client = alias == null ? null : (await alias.GetClientAsync(Constants.IdentityWsClientName));
            if (client == null)
            {
                return View("Error");
            }
            await client.DeleteAsync();

            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login", "Account");
        }

        //
        // GET: /Manage/ChangePassword
        [HttpGet]
        public IActionResult ChangePassword()
        {
            return View();
        }

        //
        // POST: /Manage/ChangePassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            ApplicationUser user = await _db.Users.FromClaimsAsync(User.Claims);
            if (user == null)
            {
                return View("Error");
            }
            Alias alias = await _identity.GetAliasAsync(user.Email);
            if (alias == null)
            {
                return View("Error");
            }

            try
            {
                await alias.ChangePasswordAsync(model.OldPassword, model.NewPassword);
                _logger.LogInformation(3, "User changed their password successfully.");
                return RedirectToAction(nameof(Index), new { Message = ManageMessageId.ChangePasswordSuccess });
            }
            catch (IdentityException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Attempting to change password for {Email}", user.Email);
                return RedirectToAction(nameof(Index), new { Message = ManageMessageId.Error });
            }
        }

        #region Helpers

        public enum ManageMessageId
        {
            ChangePasswordSuccess,
            Error
        }

        #endregion
    }
}
