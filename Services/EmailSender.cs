using Diary.Models;
using MimeKit;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;

namespace Diary.Services
{
    public enum EmailReason { NewRegistration, ForgottenPassword };

    public class EmailSender
    {
        IConfiguration _config;

        public EmailSender(IConfiguration config)
        {
            this._config = config;
        }

        public void Send(string recipient, string subject, string body, string from = null)
        {
            MimeMessage msg = new MimeMessage();
            if (from == null)
                msg.From.Add(new MailboxAddress(_config["smtp_default_from"]));
            else
                msg.From.Add(new MailboxAddress(from));
            msg.To.Add(new MailboxAddress(recipient));
            msg.Subject = subject;
            msg.Body = new TextPart("plain") { Text = body };

            using (SmtpClient client = new SmtpClient())
            {
                client.Connect(_config["smtp_host"], int.Parse(_config["smtp_port"]), false);
                if (_config["smtp_user"] != null)
                    client.Authenticate(_config["smtp_user"], _config["smtp_password"]);
                client.Send(msg);
                client.Disconnect(true);
            }
        }

        /* This really should be in a view, but that's crazy hard to achieve with MVC */
        public void SendLink(ApplicationUser user, string callbackUrlWrong, EmailReason reason)
        {
            // Alter the provided HTTPS URL by substituting the host name component with LinkPrefix
            string callbackUrl = _config["redirect_scheme_and_host"] == null ? callbackUrlWrong
                : Regex.Replace(callbackUrlWrong, "^http\\:\\/\\/[^\\/]*", _config["redirect_scheme_and_host"]);

            string verbPhrase = reason == EmailReason.NewRegistration ? "confirm your Diary account" : "reset your Diary password";
            string subject = verbPhrase.Substring(0, 1).ToUpperInvariant() + verbPhrase.Substring(1);
            string body = $"Please {verbPhrase} by clicking the following link:\n\n{callbackUrl}";
            Send(user.Email, subject, body);
        }
    }
}