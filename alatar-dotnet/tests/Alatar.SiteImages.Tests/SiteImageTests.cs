using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Alatar.Api.Controllers;
using Alatar.Api.Storage;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Features.SiteImages;
using Alatar.Domain.SiteImages;
using Alatar.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Alatar.SiteImages.Tests;

public sealed class SiteImageTests
{
    private static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=");
    private static SiteImageMetadata Details(string placement = "lands-album", bool enabled = true) =>
        new(placement, placement == "gallery" ? "farms" : null, enabled, new SiteImageText("صورة جديدة"));
    private static SiteImageMetadata Details(SiteImageResponse image) => new(image.Placement, image.Category, image.IsEnabled, image.Ar, image.En, image.Ru);
    private static MultipartFormDataContent Upload(SiteImageMetadata? details = null, byte[]? bytes = null, string name = "image.png")
    {
        var form = new MultipartFormDataContent();
        if (details != null) form.Add(new StringContent(JsonSerializer.Serialize(details)), "metadata");
        form.Add(new ByteArrayContent(bytes ?? Png), "file", name);
        return form;
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Import_preserves_existing_images_and_never_restores_deleted_images(bool existingDatabase)
    {
        await using var database = new TestDatabase();
        await using (var db = database.Context())
        {
            if (existingDatabase)
            {
                await db.Database.EnsureCreatedAsync();
                // Mimic a pre-feature database without either of the new tables.
                await db.Database.ExecuteSqlRawAsync("DROP TABLE [SiteImages]; DROP TABLE [SiteImageImports];");
            }
            else await db.Database.EnsureCreatedAsync();
            await SiteImageSeedImporter.InitializeAsync(db);
            Assert.Equal(38, await db.Set<SiteImage>().CountAsync());
            Assert.Equal(35, await db.Set<SiteImage>().CountAsync(x => x.IsEnabled));
            Assert.Equal(3, await db.Set<SiteImage>().CountAsync(x => !x.IsEnabled && x.Category == "farms"));
            var original = await db.Set<SiteImage>().OrderBy(x => x.CreatedAtUtc).FirstAsync();
            var deletedId = original.Id;
            db.Remove(original); await db.SaveChangesAsync();
            await SiteImageSeedImporter.InitializeAsync(db);
            Assert.False(await db.Set<SiteImage>().AnyAsync(x => x.Id == deletedId));
            Assert.Equal(37, await db.Set<SiteImage>().CountAsync());
            await db.Set<SiteImage>().ExecuteDeleteAsync();
        }
        // A new context models a process restart.
        await using var restarted = database.Context();
        await SiteImageSeedImporter.InitializeAsync(restarted);
        Assert.Equal(0, await restarted.Set<SiteImage>().CountAsync());
        Assert.Single(await restarted.Set<SiteImageImport>().ToArrayAsync());
    }

    [Fact]
    public async Task Api_permissions_and_CRUD_preserve_independent_placements()
    {
        using var factory = new ImageApiFactory();
        using var client = factory.CreateClient();
        Assert.Equal(20, (await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images?page=gallery"))!.Length);
        Assert.Equal(15, (await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images?page=stations"))!.Length);
        var id = Guid.NewGuid();
        foreach (var role in new[] { "", "Viewer" })
        {
            client.DefaultRequestHeaders.Remove("X-Test-Role");
            if (role != "") client.DefaultRequestHeaders.Add("X-Test-Role", role);
            var expected = role == "" ? HttpStatusCode.Unauthorized : HttpStatusCode.Forbidden;
            Assert.Equal(expected, (await client.GetAsync("/api/site-images/all")).StatusCode);
            Assert.Equal(expected, (await client.PostAsync("/api/site-images", Upload(Details()))).StatusCode);
            Assert.Equal(expected, (await client.PutAsJsonAsync($"/api/site-images/{id}", Details())).StatusCode);
            Assert.Equal(expected, (await client.PostAsync($"/api/site-images/{id}/file", Upload())).StatusCode);
            Assert.Equal(expected, (await client.DeleteAsync($"/api/site-images/{id}")).StatusCode);
            Assert.Equal(expected, (await client.PutAsJsonAsync("/api/site-images/reorder", new { placement = "lands-album", orderedIds = new[] { id } })).StatusCode);
        }
        client.DefaultRequestHeaders.Remove("X-Test-Role"); client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        var originals = (await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images/all"))!;
        Assert.Equal(38, originals.Length);
        var gallery = originals.First(x => x.Placement == "gallery" && x.SourcePath.EndsWith("mhaoutside.jpeg"));
        var station = originals.First(x => x.Placement == "station-mha" && x.SourcePath == gallery.SourcePath);
        var edited = Details(gallery) with { Ar = new SiteImageText("عنوان جديد") };
        (await client.PutAsJsonAsync($"/api/site-images/{gallery.Id}", edited)).EnsureSuccessStatusCode();
        var replacement = await client.PostAsync($"/api/site-images/{gallery.Id}/file", Upload()); replacement.EnsureSuccessStatusCode();
        var changed = (await replacement.Content.ReadFromJsonAsync<SiteImageResponse>())!;
        Assert.Equal("Upload", changed.SourceKind);
        Assert.True(File.Exists(Path.Combine(factory.UploadRoot, changed.SourcePath)));
        var current = (await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images/all"))!;
        Assert.Equal(station.SourcePath, current.Single(x => x.Id == station.Id).SourcePath);
        Assert.Equal(station.Ar, current.Single(x => x.Id == station.Id).Ar);

        var conflict = await client.PostAsync("/api/site-images", Upload(Details("sorting")));
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Single(Directory.GetFiles(Path.Combine(factory.UploadRoot, "uploads/site-images")));
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/site-images", Upload(Details(), Encoding.UTF8.GetBytes("not an image")))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/site-images", Upload(Details(), name: "image.svg"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/site-images", Upload(Details(), new byte[5 * 1024 * 1024 + 1]))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/site-images", Upload(Details() with { Ar = new SiteImageText("") }))).StatusCode);

        var first = (await (await client.PostAsync("/api/site-images", Upload(Details()))).Content.ReadFromJsonAsync<SiteImageResponse>())!;
        var second = (await (await client.PostAsync("/api/site-images", Upload(Details(enabled: false)))).Content.ReadFromJsonAsync<SiteImageResponse>())!;
        Assert.Single((await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images?page=stations"))!, x => x.Placement == "lands-album");
        (await client.PutAsJsonAsync($"/api/site-images/{second.Id}", Details(second) with { IsEnabled = true })).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync("/api/site-images/reorder", new { placement = "lands-album", orderedIds = new[] { second.Id, first.Id } })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/site-images/reorder", new { placement = "lands-album", orderedIds = new[] { first.Id, first.Id } })).StatusCode);
        var published = (await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images?page=stations"))!.Where(x => x.Placement == "lands-album").ToArray();
        Assert.Equal(new[] { second.Id, first.Id }, published.Select(x => x.Id));
        (await client.DeleteAsync($"/api/site-images/{gallery.Id}")).EnsureSuccessStatusCode();
        Assert.False(File.Exists(Path.Combine(factory.UploadRoot, changed.SourcePath)));
        Assert.Contains((await client.GetFromJsonAsync<SiteImageResponse[]>("/api/site-images/all"))!, x => x.Id == station.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync($"/api/site-images/{Guid.NewGuid()}/file", Upload())).StatusCode);
    }

    [Fact]
    public async Task Failed_replacement_keeps_original_and_cleans_new_upload()
    {
        var original = SiteImage.Create("gallery", "farms", "Asset", "assets/Images/مزارع 1.jpeg", new("مزرعة"), null, null, 0, true);
        var repository = new FailingRepository(original);
        var storage = new FakeStorage();
        var controller = new SiteImagesController(new SiteImageManager(repository), repository, storage, NullLogger<SiteImagesController>.Instance);
        var file = new FormFile(new MemoryStream(Png), 0, Png.Length, "file", "image.png");
        await Assert.ThrowsAsync<IOException>(() => controller.Replace(original.Id, file, CancellationToken.None));
        Assert.Equal("Asset", original.SourceKind);
        Assert.Equal("assets/Images/مزارع 1.jpeg", original.SourcePath);
        Assert.Equal("uploads/site-images/new.png", storage.DeletedPath);
    }

    [Fact]
    public async Task Failed_creation_cleans_its_upload_without_touching_existing_assets()
    {
        var original = SiteImage.Create("gallery", "farms", "Asset", "assets/Images/مزارع 1.jpeg", new("مزرعة"), null, null, 0, true);
        var repository = new FailingRepository(original);
        var storage = new FakeStorage();
        var controller = new SiteImagesController(new SiteImageManager(repository), repository, storage, NullLogger<SiteImagesController>.Instance);
        var file = new FormFile(new MemoryStream(Png), 0, Png.Length, "file", "image.png");
        await Assert.ThrowsAsync<IOException>(() => controller.Create(JsonSerializer.Serialize(Details()), file, CancellationToken.None));
        Assert.Equal("uploads/site-images/new.png", storage.DeletedPath);
        Assert.Equal("assets/Images/مزارع 1.jpeg", original.SourcePath);
    }

    [Fact]
    public void Seed_matches_current_categories_order_and_external_backgrounds()
    {
        var seed = SiteImageSeedImporter.ReadSeed();
        Assert.Equal(38, seed.Length);
        Assert.Equal(3, seed.Count(x => x.SourceKind == "External"));
        Assert.Equal(Enumerable.Range(0, 22), seed.Where(x => x.Placement == "gallery").Select(x => x.DisplayOrder));
        Assert.All(seed, s => SiteImageManager.Validate(new(s.Placement, s.Category, s.IsEnabled, s.Ar, s.En, s.Ru)));
        foreach (var slot in SiteImagePlacements.Slots) Assert.Single(seed, x => x.Placement == slot);
    }

    private sealed class FakeStorage : ISiteImageStorage
    {
        public string? DeletedPath;
        public Task<string> SaveAsync(IFormFile file, CancellationToken ct) => Task.FromResult("uploads/site-images/new.png");
        public Task DeleteAsync(string path, CancellationToken ct) { DeletedPath = path; return Task.CompletedTask; }
    }
    private sealed class FailingRepository(SiteImage image) : ISiteImageRepository
    {
        public Task<SiteImage?> FindAsync(Guid id, CancellationToken ct) => Task.FromResult<SiteImage?>(image);
        public Task<IReadOnlyList<SiteImage>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<SiteImage>>([image]);
        public Task AddAsync(SiteImage x, CancellationToken ct) => throw new IOException("Database unavailable");
        public Task RemoveAsync(SiteImage x, CancellationToken ct) => throw new IOException("Database unavailable");
        public Task SaveAsync(CancellationToken ct) => throw new IOException("Database unavailable");
        public Task<bool> IsUploadReferencedAsync(string path, CancellationToken ct) => Task.FromResult(path == image.SourcePath && image.SourceKind == "Upload");
    }
}
