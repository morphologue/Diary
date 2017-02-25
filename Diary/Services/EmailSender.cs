using Diary.Models;
using System.Collections.Specialized;
using System.Configuration;
using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Diary.Services
{
    public enum EmailReason { NewRegistration, ForgottenPassword };

    public static class EmailSender
    {
        private static readonly MailAddress DefaultFrom;
        private static readonly string LinkPrefix;
        private static readonly SmtpClient Smtp;

        static EmailSender()
        {
            NameValueCollection settings = ConfigurationManager.AppSettings;

            DefaultFrom = new MailAddress(settings["smtp_default_from"]);
            LinkPrefix = settings["email_link_prefix"];

            Smtp = new SmtpClient(settings["smtp_host"], int.Parse(settings["smtp_port"]));
            Smtp.EnableSsl = true;
            string smtp_user = settings["smtp_user"], smtp_password = settings["smtp_password"];
            if (smtp_user != null && smtp_password != null)
            {
                Smtp.Credentials = new NetworkCredential(smtp_user, smtp_password);
            }
        }

        public static void Send(string recipient, string subject, string body, string from = null)
        {
            MailMessage msg = new MailMessage();
            if (from == null)
            {
                msg.From = DefaultFrom;
            }
            else
            {
                msg.From = new MailAddress(from);
            }
            msg.To.Add(recipient);
            msg.Subject = subject;
            msg.Body = body;

            Smtp.Send(msg);
        }

        /* This really should be in a view, but that's crazy hard to achieve with MVC */
        public static void SendLink(ApplicationUser user, string callbackUrlWrong, EmailReason reason)
        {
            // Alter the provided HTTPS URL by substituting the host name component with LinkPrefix
            string callbackUrl = LinkPrefix == null ? callbackUrlWrong
                : Regex.Replace(callbackUrlWrong, "^https\\:\\/\\/[^\\/]*", LinkPrefix);

            string verbPhrase = reason == EmailReason.NewRegistration ? "confirm your Diary account" : "reset your Diary password";
            string subject = verbPhrase.Substring(0, 1).ToUpperInvariant() + verbPhrase.Substring(1);
            string body = $"Please {verbPhrase} by clicking the following link:\n\n{callbackUrl}";
            Send(user.Email, subject, body);
        }
    }
}