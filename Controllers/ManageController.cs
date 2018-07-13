using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Diary.Models;
using Diary.Models.ManageViewModels;
using Microsoft.Extensions.Configuration;

namespace Diary.Controllers
{
    [Authorize]
    public class ManageController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ILogger _logger;
        private readonly IConfiguration _config;

        public ManageController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILoggerFactory loggerFactory,
        IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = loggerFactory.CreateLogger<ManageController>();
            _config = config;
        }

        //
        // GET: /Manage/Index
        [HttpGet]
        public IActionResult Index(ManageMessageId? message = null)
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
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
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            return View();
        }

        //
        // POST: /Manage/DeleteAccount
        [HttpPost]
        [ValidateAntiForgeryToken]
        [ActionName("DeleteAccount")]
        public async Task<ActionResult> DeleteAccountPost()
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            ApplicationUser appUser = await GetCurrentUserAsync();
            IdentityResult result = await _userManager.DeleteAsync(appUser);
            if (!result.Succeeded) return View("Error");
            await _signInManager.SignOutAsync();
            return RedirectToAction("Login", "Account");
        }

        //
        // GET: /Manage/ChangePassword
        [HttpGet]
        public IActionResult ChangePassword()
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            return View();
        }

        //
        // POST: /Manage/ChangePassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            var user = await GetCurrentUserAsync();
            if (user != null)
            {
                var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);
                if (result.Succeeded)
                {
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    _logger.LogInformation(3, "User changed their password successfully.");
                    return RedirectToAction(nameof(Index), new { Message = ManageMessageId.ChangePasswordSuccess });
                }
                AddErrors(result);
                return View(model);
            }
            return RedirectToAction(nameof(Index), new { Message = ManageMessageId.Error });
        }

        #region Helpers

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        public enum ManageMessageId
        {
            AddPhoneSuccess,
            AddLoginSuccess,
            ChangePasswordSuccess,
            SetTwoFactorSuccess,
            SetPasswordSuccess,
            RemoveLoginSuccess,
            RemovePhoneSuccess,
            Error
        }

        private Task<ApplicationUser> GetCurrentUserAsync()
        {
            return _userManager.GetUserAsync(HttpContext.User);
        }

        #endregion
    }
}
