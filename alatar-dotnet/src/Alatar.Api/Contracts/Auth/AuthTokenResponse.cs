namespace Alatar.Api.Contracts.Auth;

public sealed record AuthTokenResponse(
    string AccessToken,
    DateTime ExpiresAtUtc);
