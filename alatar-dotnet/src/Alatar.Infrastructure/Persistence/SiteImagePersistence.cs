using System.Text.Json;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Exceptions;
using Alatar.Domain.SiteImages;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SiteImageImport
{
    public string Version { get; set; } = "";
    public DateTime AppliedAtUtc { get; set; }
}

public sealed class SqlSiteImageRepository(AlatarDbContext db) : ISiteImageRepository
{
    public Task<SiteImage?> FindAsync(Guid id, CancellationToken ct) => db.Set<SiteImage>().FirstOrDefaultAsync(x => x.Id == id, ct);
    public async Task<IReadOnlyList<SiteImage>> ListAsync(CancellationToken ct) => await db.Set<SiteImage>().ToArrayAsync(ct);
    public async Task AddAsync(SiteImage image, CancellationToken ct) { db.Add(image); await SaveAsync(ct); }
    public async Task RemoveAsync(SiteImage image, CancellationToken ct) { db.Remove(image); await SaveAsync(ct); }
    public Task<bool> IsUploadReferencedAsync(string path, CancellationToken ct) => db.Set<SiteImage>().AnyAsync(x => x.SourceKind == "Upload" && x.SourcePath == path, ct);
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new ConflictException("This placement already has an image. Replace it or delete it first."); }
    }
}

public static class SiteImageSeedImporter
{
    public const string Version = "site-images-v1";
    public sealed record SeedImage(string Placement, string? Category, string SourceKind, string SourcePath,
        SiteImageText Ar, SiteImageText En, SiteImageText Ru, int DisplayOrder, bool IsEnabled);

    public static SeedImage[] ReadSeed()
    {
        using var stream = typeof(SiteImageSeedImporter).Assembly.GetManifestResourceStream("Alatar.Infrastructure.Persistence.SiteImageSeed.json")
            ?? throw new InvalidOperationException("Missing initial site images.");
        return JsonSerializer.Deserialize<SeedImage[]>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    // The history survives deleting all images. The caller owns the initialization transaction.
    public static async Task ImportAsync(AlatarDbContext db, CancellationToken ct = default)
    {
        if (await db.Set<SiteImageImport>().AnyAsync(x => x.Version == Version, ct)) return;
        foreach (var seed in ReadSeed())
            db.Add(SiteImage.Create(seed.Placement, seed.Category, seed.SourceKind, seed.SourcePath,
                seed.Ar, seed.En, seed.Ru, seed.DisplayOrder, seed.IsEnabled));
        db.Add(new SiteImageImport { Version = Version, AppliedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync(ct);
    }

    public static async Task InitializeAsync(AlatarDbContext db)
    {
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            await using var transaction = await db.Database.BeginTransactionAsync();
            await db.Database.ExecuteSqlRawAsync("""
                DECLARE @result INT;
                EXEC @result = sp_getapplock @Resource = N'Alatar.SiteImages.Initialize', @LockMode = N'Exclusive', @LockOwner = N'Transaction', @LockTimeout = 30000;
                IF @result < 0 THROW 51000, 'Cannot acquire site image import lock.', 1;
                IF OBJECT_ID(N'[dbo].[SiteImages]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[SiteImages] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Placement] NVARCHAR(40) NOT NULL, [SlotKey] NVARCHAR(40) NULL, [Category] NVARCHAR(32) NULL,
                        [SourceKind] NVARCHAR(16) NOT NULL, [SourcePath] NVARCHAR(2000) NOT NULL,
                        [TitleAr] NVARCHAR(220) NOT NULL, [DescriptionAr] NVARCHAR(2000) NOT NULL, [AltAr] NVARCHAR(300) NOT NULL,
                        [TitleEn] NVARCHAR(220) NOT NULL, [DescriptionEn] NVARCHAR(2000) NOT NULL, [AltEn] NVARCHAR(300) NOT NULL,
                        [TitleRu] NVARCHAR(220) NOT NULL, [DescriptionRu] NVARCHAR(2000) NOT NULL, [AltRu] NVARCHAR(300) NOT NULL,
                        [DisplayOrder] INT NOT NULL, [IsEnabled] BIT NOT NULL,
                        [CreatedAtUtc] DATETIME2 NOT NULL, [UpdatedAtUtc] DATETIME2 NOT NULL
                    );
                    CREATE UNIQUE INDEX [IX_SiteImages_SlotKey] ON [dbo].[SiteImages]([SlotKey]) WHERE [SlotKey] IS NOT NULL;
                    CREATE INDEX [IX_SiteImages_Placement_DisplayOrder] ON [dbo].[SiteImages]([Placement], [DisplayOrder]);
                END
                IF OBJECT_ID(N'[dbo].[SiteImageImports]', N'U') IS NULL
                    CREATE TABLE [dbo].[SiteImageImports] ([Version] NVARCHAR(80) NOT NULL PRIMARY KEY, [AppliedAtUtc] DATETIME2 NOT NULL);
                """);
            await ImportAsync(db);
            await transaction.CommitAsync();
        });
    }
}
