using Alatar.Application.Abstractions.Persistence;
using Alatar.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Alatar.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

        services.AddDbContext<AlatarDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure());
        });

        services.AddScoped<IAlatarDbContext>(serviceProvider =>
            serviceProvider.GetRequiredService<AlatarDbContext>());

        services.AddScoped<ICategoryRepository, SqlCategoryRepository>();
        services.AddScoped<IContactRepository, SqlContactRepository>();
        services.AddScoped<IProductRepository, SqlProductRepository>();

        return services;
    }
}
