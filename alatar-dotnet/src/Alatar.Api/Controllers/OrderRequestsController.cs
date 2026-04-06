using Alatar.Api.Common;
using Alatar.Api.Contracts.OrderRequests;
using Alatar.Api.Security;
using Alatar.Application.Features.OrderRequests.AddOrderRequest;
using Alatar.Application.Features.OrderRequests.GetOrderRequests;
using Alatar.Application.Features.OrderRequests.UpdateOrderRequestStatus;
using Alatar.Domain.OrderRequests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/order-requests")]
public sealed class OrderRequestsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderRequestRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddOrderRequestCommand(
            request.ProductId,
            request.SelectedVariety,
            request.SelectedPackaging,
            request.SelectedWeight,
            request.SelectedSize,
            request.SelectedGrade,
            request.RequesterName,
            request.PhoneNumber,
            request.QuantityTons);

        var result = await sender.Send(command, cancellationToken);

        return this.ToActionResult(result, orderRequestId =>
            Created($"/api/order-requests/{orderRequestId}", new OrderRequestIdResponse(orderRequestId)));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetOrderRequestsQuery(page, pageSize), cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpPut("{orderRequestId:guid}/status")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateStatus(
        [FromRoute] Guid orderRequestId,
        [FromBody] UpdateOrderRequestStatusRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateOrderRequestStatusCommand(
            orderRequestId,
            (OrderRequestStatus)request.Status);

        var result = await sender.Send(command, cancellationToken);
        return this.ToActionResult(result);
    }
}
