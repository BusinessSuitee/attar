using Microsoft.AspNetCore.Http;

namespace Alatar.Api.Storage;

public sealed class LocalSocialIconStorage(IWebHostEnvironment environment) : ISocialIconStorage
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".svg",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif"
    };

    public async Task<string> SaveAsync(Guid socialLinkId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new InvalidOperationException("Icon file is required.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Unsupported icon extension. Allowed: svg, png, jpg, jpeg, webp, gif.");
        }

        var webRoot = ResolveWebRoot();
        var folderPath = Path.Combine(webRoot, "uploads", "social-icons");
        Directory.CreateDirectory(folderPath);

        var safeFileName = $"{socialLinkId:N}-{DateTime.UtcNow:yyyyMMddHHmmssfff}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(folderPath, safeFileName);

        await using (var fileStream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(fileStream, cancellationToken);
        }

        return Path
            .Combine("uploads", "social-icons", safeFileName)
            .Replace('\\', '/');
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return Task.CompletedTask;
        }

        cancellationToken.ThrowIfCancellationRequested();

        var normalizedRelativePath = relativePath
            .Replace('/', Path.DirectorySeparatorChar)
            .TrimStart(Path.DirectorySeparatorChar);

        var absolutePath = Path.GetFullPath(Path.Combine(ResolveWebRoot(), normalizedRelativePath));
        var webRoot = Path.GetFullPath(ResolveWebRoot());

        if (!absolutePath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid icon path.");
        }

        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }

        return Task.CompletedTask;
    }

    private string ResolveWebRoot()
    {
        var webRoot = environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(environment.ContentRootPath, "wwwroot");
        }

        Directory.CreateDirectory(webRoot);
        return webRoot;
    }
}
