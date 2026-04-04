namespace Alatar.Api.Contracts.Auth;

public sealed record AuthenticatedAdminResponse(
    string Email,
    string Role,
    DateTime? ExpiresAtUtc);
