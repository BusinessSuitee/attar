namespace Alatar.Domain.Categories;

public sealed class Category
{
    private Category()
    {
    }

    private Category(Guid id, string name, string normalizedName)
    {
        Id = id;
        Name = name;
        NormalizedName = normalizedName;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    public static Category Create(string name)
    {
        EnsureName(name);

        var trimmedName = name.Trim();

        return new Category(
            Guid.NewGuid(),
            trimmedName,
            trimmedName.ToUpperInvariant());
    }

    private static void EnsureName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 2)
        {
            throw new ArgumentException("Category name must be at least 2 characters.", nameof(name));
        }
    }
}
