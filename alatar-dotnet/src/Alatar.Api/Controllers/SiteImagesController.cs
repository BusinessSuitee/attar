using System.Text.Json;
using Alatar.Api.Security;
using Alatar.Api.Storage;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Features.SiteImages;
using Alatar.Domain.SiteImages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Alatar.Api.Controllers;

public sealed class SiteImageValidationFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not (ArgumentException or JsonException)) return;
        context.Result = new BadRequestObjectResult(new { message = context.Exception is JsonException ? "Invalid image metadata." : context.Exception.Message });
        context.ExceptionHandled = true;
    }
}

public sealed record SiteImageResponse(Guid Id, string Page, string Placement, string? Category,
    string SourceKind, string SourcePath, int DisplayOrder, bool IsEnabled,
    SiteImageText Ar, SiteImageText En, SiteImageText Ru);
public sealed record ReorderSiteImagesRequest(string Placement, Guid[] OrderedIds);

[ApiController]
[Route("api/site-images")]
[ServiceFilter(typeof(SiteImageValidationFilter))]
public sealed class SiteImagesController(SiteImageManager manager, ISiteImageRepository repository,
    ISiteImageStorage storage, ILogger<SiteImagesController> logger) : ControllerBase
{
    private static readonly JsonSerializerOptions MetadataJson = new() { PropertyNameCaseInsensitive = true };
    private static SiteImageResponse Map(SiteImage image) => new(image.Id, SiteImagePlacements.Page(image.Placement), image.Placement,
        image.Category, image.SourceKind, image.SourcePath, image.DisplayOrder, image.IsEnabled, image.Text("ar"), image.Text("en"), image.Text("ru"));

    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Public([FromQuery] string? page, CancellationToken ct) =>
        Ok((await manager.ListAsync(page, false, ct)).Select(Map));

    [HttpGet("all")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> All(CancellationToken ct) => Ok((await manager.ListAsync(null, true, ct)).Select(Map));

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Create([FromForm] string metadata, [FromForm] IFormFile file, CancellationToken ct)
    {
        var details = JsonSerializer.Deserialize<SiteImageMetadata>(metadata, MetadataJson) ?? throw new ArgumentException("Image metadata is required.");
        SiteImageManager.Validate(details);
        var path = await storage.SaveAsync(file, ct);
        try
        {
            var image = await manager.CreateAsync(details, path, ct);
            return Created($"/api/site-images/{image.Id}", Map(image));
        }
        catch
        {
            await CleanupAsync("Upload", path);
            throw;
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SiteImageMetadata metadata, CancellationToken ct) =>
        Ok(Map(await manager.UpdateAsync(id, metadata, ct)));

    [HttpPost("{id:guid}/file")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Replace(Guid id, [FromForm] IFormFile file, CancellationToken ct)
    {
        var image = await manager.FindAsync(id, ct);
        var oldKind = image.SourceKind;
        var oldPath = image.SourcePath;
        var path = await storage.SaveAsync(file, ct);
        try
        {
            image.SetSource("Upload", path);
            await repository.SaveAsync(ct);
        }
        catch
        {
            image.SetSource(oldKind, oldPath);
            await CleanupAsync("Upload", path);
            throw;
        }
        await CleanupAsync(oldKind, oldPath);
        return Ok(Map(image));
    }

    [HttpPut("reorder")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Reorder([FromBody] ReorderSiteImagesRequest request, CancellationToken ct)
    {
        await manager.ReorderAsync(request.Placement, request.OrderedIds ?? [], ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var image = await manager.FindAsync(id, ct);
        await repository.RemoveAsync(image, ct);
        await CleanupAsync(image.SourceKind, image.SourcePath);
        return NoContent();
    }

    private async Task CleanupAsync(string kind, string path)
    {
        if (kind != "Upload") return;
        try
        {
            if (!await repository.IsUploadReferencedAsync(path, CancellationToken.None))
                await storage.DeleteAsync(path, CancellationToken.None);
        }
        catch (Exception ex) { logger.LogWarning(ex, "Could not clean up site image {Path}", path); }
    }
}
