using System.Security.Claims;
using System.Text.Encodings.Web;
using Alatar.Api.Storage;
using Alatar.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Alatar.SiteImages.Tests;

// Every test database is isolated from the configured application database.
public sealed class TestDatabase : IAsyncDisposable
{
    public string Name { get; } = "AlatarSiteImagesTests_" + Guid.NewGuid().ToString("N");
    public string ConnectionString => new SqlConnectionStringBuilder {
        DataSource = Environment.GetEnvironmentVariable("ALATAR_TEST_SQL_SERVER") ?? @"(localdb)\MSSQLLocalDB",
        InitialCatalog = Name, IntegratedSecurity = true, TrustServerCertificate = true,
    }.ConnectionString;
    public AlatarDbContext Context() => new(new DbContextOptionsBuilder<AlatarDbContext>().UseSqlServer(ConnectionString).Options);
    public async ValueTask DisposeAsync()
    {
        if (!Name.StartsWith("AlatarSiteImagesTests_", StringComparison.Ordinal)) throw new InvalidOperationException("Invalid test database.");
        var builder = new SqlConnectionStringBuilder(ConnectionString) { InitialCatalog = "master" };
        SqlConnection.ClearAllPools();
        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"IF DB_ID(N'{Name}') IS NOT NULL BEGIN ALTER DATABASE [{Name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{Name}]; END";
        await command.ExecuteNonQueryAsync();
    }
}

public sealed class ImageApiFactory : WebApplicationFactory<Program>
{
    public TestDatabase Database { get; } = new();
    public string UploadRoot { get; } = Path.Combine(Path.GetTempPath(), "AlatarSiteImageTests", Guid.NewGuid().ToString("N"));
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(UploadRoot);
        builder.UseWebRoot(UploadRoot);
        builder.UseSetting("ConnectionStrings:DefaultConnection", Database.ConnectionString);
        builder.UseSetting("Jwt:SigningKey", "site-image-tests-only-signing-key-1234567890");
        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(options => {
                options.DefaultAuthenticateScheme = "Test"; options.DefaultChallengeScheme = "Test"; options.DefaultForbidScheme = "Test";
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
        });
    }
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing) return;
        Database.DisposeAsync().AsTask().GetAwaiter().GetResult();
        var parent = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "AlatarSiteImageTests")) + Path.DirectorySeparatorChar;
        if (Path.GetFullPath(UploadRoot).StartsWith(parent, StringComparison.OrdinalIgnoreCase) && Directory.Exists(UploadRoot)) Directory.Delete(UploadRoot, true);
    }
}

public sealed class TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var role = Request.Headers["X-Test-Role"].ToString();
        if (role.Length == 0) return Task.FromResult(AuthenticateResult.NoResult());
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Test user"), new Claim(ClaimTypes.Role, role)], "Test");
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), "Test")));
    }
}
