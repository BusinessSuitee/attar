namespace Alatar.Domain.SocialLinks;

public sealed class SocialLink
{
    private SocialLink()
    {
    }

    private SocialLink(
        Guid id,
        SocialPlatform platform,
        string url,
        string label,
        string? iconKey,
        string? customIconPath,
        string? colorHex,
        int displayOrder,
        bool isEnabled,
        bool opensInNewTab)
    {
        Id = id;
        Platform = platform;
        Url = url;
        Label = label;
        IconKey = iconKey;
        CustomIconPath = customIconPath;
        ColorHex = colorHex;
        DisplayOrder = displayOrder;
        IsEnabled = isEnabled;
        OpensInNewTab = opensInNewTab;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid Id { get; private set; }
    public SocialPlatform Platform { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string Label { get; private set; } = string.Empty;
    public string? IconKey { get; private set; }
    public string? CustomIconPath { get; private set; }
    public string? ColorHex { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsEnabled { get; private set; }
    public bool OpensInNewTab { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static SocialLink Create(
        SocialPlatform platform,
        string url,
        string label,
        string? iconKey,
        string? customIconPath,
        string? colorHex,
        int displayOrder,
        bool isEnabled,
        bool opensInNewTab)
    {
        EnsureUrl(url);
        EnsureLabel(label);
        var normalizedColor = NormalizeColorHex(colorHex);
        var trimmedIconKey = string.IsNullOrWhiteSpace(iconKey) ? null : iconKey.Trim();
        var trimmedCustomIconPath = string.IsNullOrWhiteSpace(customIconPath) ? null : customIconPath.Trim();

        return new SocialLink(
            Guid.NewGuid(),
            platform,
            url.Trim(),
            label.Trim(),
            trimmedIconKey,
            trimmedCustomIconPath,
            normalizedColor,
            Math.Max(0, displayOrder),
            isEnabled,
            opensInNewTab);
    }

    public void UpdateDetails(
        SocialPlatform platform,
        string url,
        string label,
        string? iconKey,
        string? colorHex,
        bool opensInNewTab)
    {
        EnsureUrl(url);
        EnsureLabel(label);

        Platform = platform;
        Url = url.Trim();
        Label = label.Trim();
        IconKey = string.IsNullOrWhiteSpace(iconKey) ? null : iconKey.Trim();
        ColorHex = NormalizeColorHex(colorHex);
        OpensInNewTab = opensInNewTab;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetCustomIcon(string? relativePath)
    {
        CustomIconPath = string.IsNullOrWhiteSpace(relativePath) ? null : relativePath.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Reorder(int newOrder)
    {
        DisplayOrder = Math.Max(0, newOrder);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetEnabled(bool enabled)
    {
        IsEnabled = enabled;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private static void EnsureUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("URL is required.", nameof(url));
        }

        if (url.Trim().Length > 500)
        {
            throw new ArgumentException("URL must be 500 characters or less.", nameof(url));
        }
    }

    private static void EnsureLabel(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            throw new ArgumentException("Label is required.", nameof(label));
        }

        if (label.Trim().Length > 80)
        {
            throw new ArgumentException("Label must be 80 characters or less.", nameof(label));
        }
    }

    private static string? NormalizeColorHex(string? colorHex)
    {
        if (string.IsNullOrWhiteSpace(colorHex))
        {
            return null;
        }

        var trimmed = colorHex.Trim();
        if (!trimmed.StartsWith('#'))
        {
            trimmed = "#" + trimmed;
        }

        if (trimmed.Length is not (4 or 7 or 9))
        {
            throw new ArgumentException("Color must be a valid hex (#RGB, #RRGGBB or #RRGGBBAA).", nameof(colorHex));
        }

        return trimmed.ToUpperInvariant();
    }
}
