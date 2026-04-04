using Alatar.Api.Common;
using Alatar.Api.Configuration;
using Alatar.Application;
using Alatar.Infrastructure;
using Alatar.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiConfiguration(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseCors(CorsPolicies.Frontend);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () =>
    Results.Ok(new
    {
        Service = "Alatar.Api",
        Architecture = "Clean Architecture + MediatR + Controllers"
    }));

await app.Services.EnsureDatabaseCreatedAsync();

app.Run();
