using Alatar.Api.Common;
using Alatar.Api.Contracts.Categories;
using Alatar.Api.Security;
using Alatar.Application.Features.Categories.AddCategory;
using Alatar.Application.Features.Categories.DeleteCategory;
using Alatar.Application.Features.Categories.GetCategories;
using Alatar.Application.Features.Categories.UpdateCategory;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCategoriesQuery(), cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new AddCategoryCommand(request.Name, request.Type, request.Season),
            cancellationToken);

        return this.ToActionResult(result, categoryId =>
            Created($"/api/categories/{categoryId}", new CategoryIdResponse(categoryId)));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateCategoryCommand(id, request.Name, request.Type, request.Season),
            cancellationToken);

        return this.ToActionResult(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteCategoryCommand(id), cancellationToken);
        return this.ToActionResult(result);
    }
}
