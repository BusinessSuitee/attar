namespace Alatar.Domain.Categories;

public sealed class Category
{
    private Category()
    {
    }

    private Category(Guid id, string name, string normalizedName, CategoryType type, Season season)
    {
        Id = id;
        Name = name;
        NormalizedName = normalizedName;
        Type = type;
        Season = season;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public CategoryType Type { get; private set; }
    public Season Season { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static Category Create(string name, CategoryType type, Season season)
    {
        EnsureName(name);

        var trimmedName = name.Trim();

        return new Category(
            Guid.NewGuid(),
            trimmedName,
            trimmedName.ToUpperInvariant(),
            type,
            season);
    }

    public void Rename(string newName)
    {
        EnsureName(newName);
        var trimmed = newName.Trim();
        Name = trimmed;
        NormalizedName = trimmed.ToUpperInvariant();
    }

    public void ChangeType(CategoryType newType)
    {
        Type = newType;
    }

    public void ChangeSeason(Season newSeason)
    {
        Season = newSeason;
    }

    private static void EnsureName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 2)
        {
            throw new ArgumentException("Category name must be at least 2 characters.", nameof(name));
        }
    }
}
