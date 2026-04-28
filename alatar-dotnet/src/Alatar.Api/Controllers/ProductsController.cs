using Alatar.Api.Common;
using Alatar.Api.Contracts.Products;
using Alatar.Api.Security;
using Alatar.Api.Storage;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Features.Products.AddProduct;
using Alatar.Application.Features.Products.ChangeProductStatus;
using Alatar.Application.Features.Products.DeleteProduct;
using Alatar.Application.Features.Products.GetProducts;
using Alatar.Application.Features.Products.UpdateProduct;
using Alatar.Domain.Products;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(
    ISender sender,
    IProductRepository productRepository,
    IProductImageStorage productImageStorage) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddProductCommand(
            request.Name,
            request.NameAr,
            request.Sku,
            request.Price,
            request.OpeningStock,
            request.DescriptionEn,
            request.DescriptionAr,
            request.ProductType,
            request.ProductState,
            request.Season,
            request.Varieties ?? [],
            MapLocalizedOptions(request.VarietiesLocalized),
            request.PackagingOptions ?? [],
            MapLocalizedOptions(request.PackagingOptionsLocalized),
            request.WeightOptions ?? [],
            MapLocalizedOptions(request.WeightOptionsLocalized),
            request.SizeOptions ?? [],
            MapLocalizedOptions(request.SizeOptionsLocalized),
            request.GradeOptions ?? [],
            MapLocalizedOptions(request.GradeOptionsLocalized));

        var result = await sender.Send(command, cancellationToken);

        return this.ToActionResult(result, productId =>
            Created($"/api/products/{productId}", new ProductIdResponse(productId)));
    }

    [HttpPut("{productId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(
        Guid productId,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateProductCommand(
            productId,
            request.Name,
            request.NameAr,
            request.Price,
            request.StockQuantity,
            request.DescriptionEn,
            request.DescriptionAr,
            request.ProductType,
            request.ProductState,
            request.Season,
            request.Varieties ?? [],
            MapLocalizedOptions(request.VarietiesLocalized),
            request.PackagingOptions ?? [],
            MapLocalizedOptions(request.PackagingOptionsLocalized),
            request.WeightOptions ?? [],
            MapLocalizedOptions(request.WeightOptionsLocalized),
            request.SizeOptions ?? [],
            MapLocalizedOptions(request.SizeOptionsLocalized),
            request.GradeOptions ?? [],
            MapLocalizedOptions(request.GradeOptionsLocalized));

        var result = await sender.Send(command, cancellationToken);

        return this.ToActionResult(result, id => Ok(new ProductIdResponse(id)));
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetProductsQuery(), cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpPatch("{productId:guid}/status")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> ChangeStatus(
        Guid productId,
        [FromBody] ChangeProductStatusRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ChangeProductStatusCommand(productId, request.Status);
        var result = await sender.Send(command, cancellationToken);
        return this.ToActionResult(result, id => Ok(new ProductIdResponse(id)));
    }

    [HttpDelete("{productId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid productId, CancellationToken cancellationToken)
    {
        var images = await productRepository.ListImagesAsync(productId, cancellationToken);
        var result = await sender.Send(new DeleteProductCommand(productId), cancellationToken);

        if (result.IsFailure)
        {
            return this.ToActionResult(result);
        }

        foreach (var image in images)
        {
            try
            {
                await productImageStorage.DeleteAsync(image.RelativePath, cancellationToken);
            }
            catch
            {
                // Best-effort cleanup after a successful database delete.
            }
        }

        return NoContent();
    }

    [HttpPost("{productId:guid}/images")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadImages(
        Guid productId,
        [FromForm] List<IFormFile> files,
        CancellationToken cancellationToken)
    {
        if (files.Count == 0)
        {
            return BadRequest(new { message = "At least one image is required." });
        }

        var product = await productRepository.GetByIdAsync(productId, cancellationToken);
        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        var existingImages = await productRepository.ListImagesAsync(productId, cancellationToken);
        var nextDisplayOrder = existingImages.Count;
        var uploaded = new List<object>(files.Count);

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                continue;
            }

            var relativePath = await productImageStorage.SaveAsync(productId, file, cancellationToken);
            var image = ProductImage.Create(productId, relativePath, nextDisplayOrder++);
            await productRepository.AddImageAsync(image, cancellationToken);

            uploaded.Add(new
            {
                image.Id,
                image.RelativePath,
                image.DisplayOrder
            });
        }

        if (uploaded.Count == 0)
        {
            return BadRequest(new { message = "No valid images were uploaded." });
        }

        return Ok(uploaded);
    }

    [HttpDelete("{productId:guid}/images/{imageId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteImage(
        Guid productId,
        Guid imageId,
        CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(productId, cancellationToken);
        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        var image = await productRepository.GetImageByIdAsync(imageId, cancellationToken);
        if (image is null || image.ProductId != productId)
        {
            return NotFound(new { message = "Image not found." });
        }

        await productImageStorage.DeleteAsync(image.RelativePath, cancellationToken);
        await productRepository.RemoveImageAsync(image, cancellationToken);

        return NoContent();
    }

    private static IReadOnlyCollection<LocalizedProductOption> MapLocalizedOptions(
        IReadOnlyCollection<LocalizedProductOptionRequest>? options)
    {
        if (options is null || options.Count == 0)
        {
            return [];
        }

        return options
            .Select(option => new LocalizedProductOption(
                option.Key,
                option.LabelEn,
                option.LabelAr))
            .ToArray();
    }
}
