using Microsoft.AspNetCore.Http;

namespace Alatar.Api.Storage;

public sealed class LocalProductImageStorage(IWebHostEnvironment environment) : IProductImageStorage
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };

    public async Task<string> SaveAsync(Guid productId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new InvalidOperationException("Image file is required.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Unsupported image extension.");
        }

        var webRoot = ResolveWebRoot();
        var productFolderPath = Path.Combine(webRoot, "uploads", "products", productId.ToString("N"));
        Directory.CreateDirectory(productFolderPath);

        var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(productFolderPath, safeFileName);

        await using (var fileStream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(fileStream, cancellationToken);
        }

        return Path
            .Combine("uploads", "products", productId.ToString("N"), safeFileName)
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
            throw new InvalidOperationException("Invalid image path.");
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
