namespace Alatar.Domain.SiteImages;

public static class SiteImagePlacements
{
    public const string Gallery = "gallery";
    public static readonly string[] Albums = [Gallery, "station-qtc", "station-mha", "station-attar", "lands-album"];
    public static readonly string[] Slots = ["gallery-hero", "stations-hero", "lands-background", "sorting", "washing", "packing", "shipping"];
    public static bool IsValid(string value) => Albums.Contains(value) || Slots.Contains(value);
    public static bool IsSlot(string value) => Slots.Contains(value);
    public static string Page(string value) => value is Gallery or "gallery-hero" ? "gallery" : "stations";
}

public sealed record SiteImageText(string Title, string Description = "", string Alt = "");

public sealed class SiteImage
{
    public Guid Id { get; private set; }
    public string Placement { get; private set; } = "";
    public string? SlotKey { get; private set; }
    public string? Category { get; private set; }
    public string SourceKind { get; private set; } = "";
    public string SourcePath { get; private set; } = "";
    public string TitleAr { get; private set; } = "";
    public string DescriptionAr { get; private set; } = "";
    public string AltAr { get; private set; } = "";
    public string TitleEn { get; private set; } = "";
    public string DescriptionEn { get; private set; } = "";
    public string AltEn { get; private set; } = "";
    public string TitleRu { get; private set; } = "";
    public string DescriptionRu { get; private set; } = "";
    public string AltRu { get; private set; } = "";
    public int DisplayOrder { get; private set; }
    public bool IsEnabled { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private SiteImage() { }

    public static SiteImage Create(string placement, string? category, string sourceKind, string sourcePath,
        SiteImageText ar, SiteImageText? en, SiteImageText? ru, int order, bool enabled)
    {
        var image = new SiteImage { Id = Guid.NewGuid(), CreatedAtUtc = DateTime.UtcNow };
        image.Update(placement, category, ar, en, ru, enabled);
        image.SetSource(sourceKind, sourcePath);
        image.Reorder(order);
        return image;
    }

    public void Update(string placement, string? category, SiteImageText ar, SiteImageText? en, SiteImageText? ru, bool enabled)
    {
        Placement = placement;
        SlotKey = SiteImagePlacements.IsSlot(placement) ? placement : null;
        Category = placement == SiteImagePlacements.Gallery ? category : null;
        TitleAr = ar.Title.Trim(); DescriptionAr = ar.Description.Trim(); AltAr = ar.Alt.Trim();
        TitleEn = en?.Title.Trim() ?? ""; DescriptionEn = en?.Description.Trim() ?? ""; AltEn = en?.Alt.Trim() ?? "";
        TitleRu = ru?.Title.Trim() ?? ""; DescriptionRu = ru?.Description.Trim() ?? ""; AltRu = ru?.Alt.Trim() ?? "";
        IsEnabled = enabled;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetSource(string kind, string path) { SourceKind = kind; SourcePath = path; UpdatedAtUtc = DateTime.UtcNow; }
    public void Reorder(int order) { DisplayOrder = order; UpdatedAtUtc = DateTime.UtcNow; }
    public SiteImageText Text(string lang) => lang switch
    {
        "en" => new(TitleEn, DescriptionEn, AltEn),
        "ru" => new(TitleRu, DescriptionRu, AltRu),
        _ => new(TitleAr, DescriptionAr, AltAr)
    };
}
