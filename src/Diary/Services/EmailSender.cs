using Diary.Models;
using MimeKit;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;

namespace Diary.Services
{
    public enum EmailReason { NewRegistration, ForgottenPassword };

    public static class EmailSender
    {
        public static void Send(string recipient, string subject, string body, string from = null)
        {
            MimeMessage msg = new MimeMessage();
            if (from == null)
                msg.From.Add(new MailboxAddress(Startup.Configuration["smtp_default_from"]));
            else
                msg.From.Add(new MailboxAddress(from));
            msg.To.Add(new MailboxAddress(recipient));
            msg.Subject = subject;
            msg.Body = new TextPart("plain") { Text = body };

            using (SmtpClient client = new SmtpClient())
            {
                client.Connect(Startup.Configuration["smtp_host"], int.Parse(Startup.Configuration["smtp_port"]), false);
                if (Startup.Configuration["smtp_user"] != null)
                    client.Authenticate(Startup.Configuration["smtp_user"], Startup.Configuration["smtp_password"]);
                client.Send(msg);
                client.Disconnect(true);
            }
        }

        /* This really should be in a view, but that's crazy hard to achieve with MVC */
        public static void SendLink(ApplicationUser user, string callbackUrlWrong, EmailReason reason)
        {
            // Alter the provided HTTPS URL by substituting the host name component with LinkPrefix
            string callbackUrl = Startup.Configuration["redirect_scheme_and_host"] == null ? callbackUrlWrong
                : Regex.Replace(callbackUrlWrong, "^http\\:\\/\\/[^\\/]*", Startup.Configuration["redirect_scheme_and_host"]);

            string verbPhrase = reason == EmailReason.NewRegistration ? "confirm your Diary account" : "reset your Diary password";
            string subject = verbPhrase.Substring(0, 1).ToUpperInvariant() + verbPhrase.Substring(1);
            string body = $"Please {verbPhrase} by clicking the following link:\n\n{callbackUrl}";
            Send(user.Email, subject, body);
        }
    }
}