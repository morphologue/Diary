namespace Diary.Models.AccountViewModels
{
    public interface ICausesLogin
    {
        string Password { get; }

        string Email { get; }

        bool RememberMe { get; }
    }
}
