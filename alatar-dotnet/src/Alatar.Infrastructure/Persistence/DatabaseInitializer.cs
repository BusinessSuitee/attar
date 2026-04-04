using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Alatar.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task EnsureDatabaseCreatedAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AlatarDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        await EnsureCategoriesTableExistsAsync(dbContext);
        await EnsureContactsTableExistsAsync(dbContext);
    }

    private static async Task EnsureCategoriesTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[Categories]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[Categories]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [Name] NVARCHAR(120) NOT NULL,
                                   [NormalizedName] NVARCHAR(120) NOT NULL,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
                               );
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_Categories_NormalizedName'
                                   AND object_id = OBJECT_ID(N'[dbo].[Categories]')
                           )
                           BEGIN
                               CREATE UNIQUE INDEX [IX_Categories_NormalizedName]
                                   ON [dbo].[Categories]([NormalizedName]);
                           END
                           """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static Task EnsureContactsTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[Contacts]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[Contacts]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [FullName] NVARCHAR(200) NOT NULL,
                                   [PhoneNumber] NVARCHAR(64) NOT NULL,
                                   [ServiceType] NVARCHAR(16) NOT NULL,
                                   [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Contacts_Status] DEFAULT N'InProgress',
                                   [CompanyName] NVARCHAR(200) NULL,
                                   [Country] NVARCHAR(128) NULL,
                                   [Crop] NVARCHAR(128) NULL,
                                   [QuantityTons] DECIMAL(18,2) NULL,
                                   [DeliveryWindow] NVARCHAR(128) NULL,
                                   [Notes] NVARCHAR(2000) NULL,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_Contacts] PRIMARY KEY ([Id])
                               );
                           END

                           IF COL_LENGTH(N'[dbo].[Contacts]', N'Status') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Contacts]
                               ADD [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Contacts_Status] DEFAULT N'InProgress';
                           END
                           """;

        return dbContext.Database.ExecuteSqlRawAsync(sql);
    }
}
