namespace Alatar.Api.Security;

public interface IJwtTokenGenerator
{
    (string AccessToken, DateTime ExpiresAtUtc) GenerateAdminToken(string email);
}
