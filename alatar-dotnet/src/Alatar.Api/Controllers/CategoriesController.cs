using Alatar.Api.Common;
using Alatar.Api.Contracts.Categories;
using Alatar.Api.Security;
using Alatar.Application.Features.Categories.AddCategory;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AddCategoryCommand(request.Name), cancellationToken);

        return this.ToActionResult(result, categoryId =>
            Created($"/api/categories/{categoryId}", new CategoryIdResponse(categoryId)));
    }
}
