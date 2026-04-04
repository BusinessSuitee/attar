using Alatar.Api.Common;
using Alatar.Api.Contracts.Products;
using Alatar.Api.Security;
using Alatar.Application.Features.Products.AddProduct;
using Alatar.Application.Features.Products.GetProducts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddProductCommand(
            request.Name,
            request.Sku,
            request.Price,
            request.OpeningStock);

        var result = await sender.Send(command, cancellationToken);

        return this.ToActionResult(result, productId =>
            Created($"/api/products/{productId}", new ProductIdResponse(productId)));
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetProductsQuery(), cancellationToken);
        return this.ToActionResult(result, Ok);
    }
}
