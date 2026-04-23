using Alatar.Api.Common;
using Alatar.Api.Contracts.SocialLinks;
using Alatar.Api.Security;
using Alatar.Api.Storage;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Features.SocialLinks.AddSocialLink;
using Alatar.Application.Features.SocialLinks.DeleteSocialLink;
using Alatar.Application.Features.SocialLinks.GetSocialLinks;
using Alatar.Application.Features.SocialLinks.ReorderSocialLinks;
using Alatar.Application.Features.SocialLinks.ToggleSocialLink;
using Alatar.Application.Features.SocialLinks.UpdateSocialLink;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/social-links")]
public sealed class SocialLinksController(
    ISender sender,
    ISocialLinkRepository socialLinkRepository,
    ISocialIconStorage socialIconStorage) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetEnabled(CancellationToken cancellationToken)
    {
        var baseUrl = BuildBaseUrl();
        var result = await sender.Send(
            new GetSocialLinksQuery(OnlyEnabled: true, CustomIconBaseUrl: baseUrl),
            cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpGet("all")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var baseUrl = BuildBaseUrl();
        var result = await sender.Send(
            new GetSocialLinksQuery(OnlyEnabled: false, CustomIconBaseUrl: baseUrl),
            cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create(
        [FromBody] CreateSocialLinkRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddSocialLinkCommand(
            request.Platform,
            request.Url,
            request.Label,
            request.IconKey,
            request.ColorHex,
            request.OpensInNewTab);

        var result = await sender.Send(command, cancellationToken);
        return this.ToActionResult(result, id =>
            Created($"/api/social-links/{id}", new SocialLinkIdResponse(id)));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateSocialLinkRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateSocialLinkCommand(
            id,
            request.Platform,
            request.Url,
            request.Label,
            request.IconKey,
            request.ColorHex,
            request.OpensInNewTab);

        var result = await sender.Send(command, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteSocialLinkCommand(id), cancellationToken);

        if (result.IsSuccess && !string.IsNullOrWhiteSpace(result.Value))
        {
            try
            {
                await socialIconStorage.DeleteAsync(result.Value!, cancellationToken);
            }
            catch
            {
                // swallow — orphaned file is not fatal.
            }
        }

        return this.ToActionResult(result, _ => NoContent());
    }

    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Toggle(
        Guid id,
        [FromBody] ToggleSocialLinkRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ToggleSocialLinkCommand(id, request.IsEnabled), cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPut("reorder")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Reorder(
        [FromBody] ReorderSocialLinksRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReorderSocialLinksCommand(request.OrderedIds ?? []),
            cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPost("{id:guid}/icon")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadIcon(
        Guid id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "An icon file is required." });
        }

        var entity = await socialLinkRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = "Social link not found." });
        }

        if (!string.IsNullOrWhiteSpace(entity.CustomIconPath))
        {
            try
            {
                await socialIconStorage.DeleteAsync(entity.CustomIconPath, cancellationToken);
            }
            catch
            {
                // ignore
            }
        }

        string relativePath;
        try
        {
            relativePath = await socialIconStorage.SaveAsync(id, file, cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        entity.SetCustomIcon(relativePath);
        await socialLinkRepository.UpdateAsync(entity, cancellationToken);

        var iconUrl = BuildAbsoluteUrl(relativePath);
        return Ok(new { relativePath, url = iconUrl });
    }

    [HttpDelete("{id:guid}/icon")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteIcon(Guid id, CancellationToken cancellationToken)
    {
        var entity = await socialLinkRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = "Social link not found." });
        }

        if (!string.IsNullOrWhiteSpace(entity.CustomIconPath))
        {
            try
            {
                await socialIconStorage.DeleteAsync(entity.CustomIconPath, cancellationToken);
            }
            catch
            {
                // ignore
            }
        }

        entity.SetCustomIcon(null);
        await socialLinkRepository.UpdateAsync(entity, cancellationToken);

        return NoContent();
    }

    private string BuildBaseUrl()
    {
        var request = HttpContext.Request;
        return $"{request.Scheme}://{request.Host}{request.PathBase}";
    }

    private string BuildAbsoluteUrl(string relativePath)
    {
        var baseUrl = BuildBaseUrl().TrimEnd('/');
        var trimmedPath = relativePath.TrimStart('/');
        return $"{baseUrl}/{trimmedPath}";
    }
}
