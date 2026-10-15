namespace Alatar.Api.Storage;

public interface ISiteImageStorage
{
    Task<string> SaveAsync(IFormFile file, CancellationToken ct);
    Task DeleteAsync(string relativePath, CancellationToken ct);
}

public sealed class LocalSiteImageStorage(IWebHostEnvironment environment) : ISiteImageStorage
{
    public const long MaxFileSize = 5 * 1024 * 1024;
    private static readonly string[] Extensions = [".jpg", ".jpeg", ".png", ".webp"];

    public async Task<string> SaveAsync(IFormFile file, CancellationToken ct)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (file.Length == 0 || file.Length > MaxFileSize || !Extensions.Contains(extension))
            throw new ArgumentException("Use a JPG, JPEG, PNG or WebP image up to 5MB.");
        await using (var input = file.OpenReadStream())
        {
            var header = new byte[12];
            var count = await input.ReadAtLeastAsync(header, 12, throwOnEndOfStream: false, cancellationToken: ct);
            var valid = count >= 12 && extension switch
            {
                ".jpg" or ".jpeg" => header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff,
                ".png" => header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
                ".webp" => header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
                _ => false
            };
            if (!valid) throw new ArgumentException("The file content does not match a supported image format.");
        }
        var name = Guid.NewGuid().ToString("N") + extension;
        var folder = UploadRoot();
        Directory.CreateDirectory(folder);
        var path = Path.Combine(folder, name);
        try
        {
            await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            await file.CopyToAsync(output, ct);
        }
        catch
        {
            if (File.Exists(path)) File.Delete(path);
            throw;
        }
        return "uploads/site-images/" + name;
    }

    public Task DeleteAsync(string relativePath, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        const string prefix = "uploads/site-images/";
        if (!relativePath.StartsWith(prefix, StringComparison.Ordinal)) throw new ArgumentException("Invalid site image path.");
        var root = Path.GetFullPath(UploadRoot()) + Path.DirectorySeparatorChar;
        var path = Path.GetFullPath(Path.Combine(root, relativePath[prefix.Length..]));
        if (!path.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Invalid site image path.");
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    private string UploadRoot() => Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "site-images");
}
