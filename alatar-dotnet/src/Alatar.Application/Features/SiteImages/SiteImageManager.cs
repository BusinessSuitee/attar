using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Exceptions;
using Alatar.Domain.SiteImages;

namespace Alatar.Application.Features.SiteImages;

public sealed record SiteImageMetadata(string Placement, string? Category, bool IsEnabled,
    SiteImageText Ar, SiteImageText? En = null, SiteImageText? Ru = null);

public sealed class SiteImageManager(ISiteImageRepository repository)
{
    public async Task<SiteImage> FindAsync(Guid id, CancellationToken ct) =>
        await repository.FindAsync(id, ct) ?? throw new NotFoundException("Site image not found.");

    public async Task<IReadOnlyList<SiteImage>> ListAsync(string? page, bool includeHidden, CancellationToken ct)
    {
        if (page is not (null or "gallery" or "stations")) throw new ArgumentException("Invalid page.");
        var images = await repository.ListAsync(ct);
        return images.Where(x => (includeHidden || x.IsEnabled) && (page == null || SiteImagePlacements.Page(x.Placement) == page))
            .OrderBy(x => x.Placement).ThenBy(x => x.DisplayOrder).ThenBy(x => x.CreatedAtUtc).ThenBy(x => x.Id).ToArray();
    }

    public async Task<SiteImage> CreateAsync(SiteImageMetadata metadata, string path, CancellationToken ct)
    {
        Validate(metadata);
        var all = await repository.ListAsync(ct);
        EnsureAvailable(metadata.Placement, all, null);
        var order = NextOrder(all, metadata.Placement);
        var image = SiteImage.Create(metadata.Placement, metadata.Category, "Upload", path,
            metadata.Ar, metadata.En, metadata.Ru, order, metadata.IsEnabled);
        await repository.AddAsync(image, ct);
        return image;
    }

    public async Task<SiteImage> UpdateAsync(Guid id, SiteImageMetadata metadata, CancellationToken ct)
    {
        Validate(metadata);
        var image = await FindAsync(id, ct);
        var all = await repository.ListAsync(ct);
        EnsureAvailable(metadata.Placement, all, id);
        if (image.Placement != metadata.Placement) image.Reorder(NextOrder(all, metadata.Placement));
        image.Update(metadata.Placement, metadata.Category, metadata.Ar, metadata.En, metadata.Ru, metadata.IsEnabled);
        await repository.SaveAsync(ct);
        return image;
    }

    public async Task ReorderAsync(string placement, IReadOnlyList<Guid> ids, CancellationToken ct)
    {
        if (!SiteImagePlacements.IsValid(placement)) throw new ArgumentException("Invalid placement.");
        var images = (await repository.ListAsync(ct)).Where(x => x.Placement == placement).ToDictionary(x => x.Id);
        if (ids.Count != images.Count || ids.Distinct().Count() != ids.Count || ids.Any(id => !images.ContainsKey(id)))
            throw new ArgumentException("The order must contain every image in this placement exactly once.");
        for (var i = 0; i < ids.Count; i++) images[ids[i]].Reorder(i);
        await repository.SaveAsync(ct);
    }

    private static int NextOrder(IEnumerable<SiteImage> all, string placement) =>
        all.Where(x => x.Placement == placement).Select(x => x.DisplayOrder).DefaultIfEmpty(-1).Max() + 1;

    private static void EnsureAvailable(string placement, IEnumerable<SiteImage> all, Guid? except)
    {
        if (SiteImagePlacements.IsSlot(placement) && all.Any(x => x.Placement == placement && x.Id != except))
            throw new ConflictException("This placement already has an image. Replace it or delete it first.");
    }

    public static void Validate(SiteImageMetadata metadata)
    {
        if (!SiteImagePlacements.IsValid(metadata.Placement)) throw new ArgumentException("Invalid placement.");
        if (metadata.Placement == "gallery" && metadata.Category is not ("farms" or "stations" or "crops" or "legacy"))
            throw new ArgumentException("A valid gallery category is required.");
        if (metadata.Ar == null || string.IsNullOrWhiteSpace(metadata.Ar.Title)) throw new ArgumentException("Arabic title is required.");
        foreach (var text in new[] { metadata.Ar, metadata.En, metadata.Ru }.OfType<SiteImageText>())
        {
            if (text.Title == null || text.Description == null || text.Alt == null || text.Title.Length > 220 || text.Description.Length > 2000 || text.Alt.Length > 300)
                throw new ArgumentException("Invalid image text or text is too long.");
        }
    }
}
