namespace Alatar.Application.Features.OrderRequests.GetOrderRequests;

public sealed record GetOrderRequestsResponse(
    IReadOnlyCollection<OrderRequestListItemResponse> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);
