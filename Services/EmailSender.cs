using Diary.Models;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Morphologue.IdentityWsClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Diary.Services
{
    public enum EmailReason { NewRegistration, ForgottenPassword };

    public class EmailSender
    {
        ILogger<EmailSender> _log;
        IConfiguration _config;
        IdentityWs _identity;

        public EmailSender(ILogger<EmailSender> log, IConfiguration config, IdentityWs identity)
        {
            this._log = log;
            this._config = config;
            this._identity = identity;
        }

        private async Task SendAsync(string recipient, string subject, string body, bool send_if_unconfirmed)
        {
            Alias alias = await _identity.GetAliasAsync(recipient);
            if (alias == null)
            {
                _log.LogError("Could not email recipient with no Alias: {recipient}", recipient);
                return;
            }

            await alias.Email(_config["email_from"], subject, body, sendIfUnconfirmed: send_if_unconfirmed);
        }

        /* This really should be in a view, but that's crazy hard to achieve with MVC */
        public async Task SendLinkAsync(ApplicationUser user, string callbackUrl, EmailReason reason)
        {
            string verbPhrase = reason == EmailReason.NewRegistration ? "confirm your Diary account" : "reset your Diary password";
            string subject = verbPhrase.Substring(0, 1).ToUpperInvariant() + verbPhrase.Substring(1);
            string body = $"Please {verbPhrase} by clicking the following link:\n\n{_config["redirect_scheme_and_host"] + callbackUrl}";
            await SendAsync(user.Email, subject, body, reason == EmailReason.NewRegistration);
        }
    }
}