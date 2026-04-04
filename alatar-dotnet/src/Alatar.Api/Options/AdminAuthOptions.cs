namespace Alatar.Api.Options;

public sealed class AdminAuthOptions
{
    public const string SectionName = "AdminAuth";

    public string Email { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}
