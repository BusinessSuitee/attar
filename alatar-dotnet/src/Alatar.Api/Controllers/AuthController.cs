using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Alatar.Api.Contracts.Auth;
using Alatar.Api.Options;
using Alatar.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IOptions<AdminAuthOptions> adminAuthOptions,
    IJwtTokenGenerator jwtTokenGenerator)
    : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { Message = "Email and password are required." });
        }

        var admin = adminAuthOptions.Value;

        var validCredentials =
            string.Equals(request.Email.Trim(), admin.Email, StringComparison.OrdinalIgnoreCase)
            && request.Password == admin.Password;

        if (!validCredentials)
        {
            return Unauthorized();
        }

        var (accessToken, expiresAtUtc) = jwtTokenGenerator.GenerateAdminToken(admin.Email);
        return Ok(new AuthTokenResponse(accessToken, expiresAtUtc));
    }

    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Email)
            ?? string.Empty;

        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        DateTime? expiresAtUtc = null;
        var exp = User.FindFirstValue(JwtRegisteredClaimNames.Exp);

        if (long.TryParse(exp, out var expSeconds))
        {
            expiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
        }

        return Ok(new AuthenticatedAdminResponse(email, role, expiresAtUtc));
    }
}
