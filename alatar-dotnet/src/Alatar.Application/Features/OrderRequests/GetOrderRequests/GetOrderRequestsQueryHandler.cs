using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.GetOrderRequests;

public sealed class GetOrderRequestsQueryHandler(IOrderRequestRepository orderRequestRepository)
    : IRequestHandler<GetOrderRequestsQuery, Result<GetOrderRequestsResponse>>
{
    public async Task<Result<GetOrderRequestsResponse>> Handle(
        GetOrderRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch
        {
            < 1 => 50,
            > 100 => 100,
            _ => request.PageSize
        };

        var (orderRequests, totalCount) = await orderRequestRepository.ListPagedAsync(
            page,
            pageSize,
            cancellationToken);

        IReadOnlyCollection<OrderRequestListItemResponse> response = orderRequests
            .Select(orderRequest => new OrderRequestListItemResponse(
                orderRequest.Id,
                orderRequest.ProductId,
                orderRequest.ProductNameSnapshot,
                orderRequest.RequesterName,
                orderRequest.PhoneNumber,
                orderRequest.QuantityTons,
                orderRequest.SelectedVariety,
                orderRequest.SelectedPackaging,
                orderRequest.SelectedWeight,
                orderRequest.SelectedSize,
                orderRequest.SelectedGrade,
                orderRequest.Status.ToString(),
                orderRequest.CreatedAtUtc))
            .ToArray();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        return Result.Success(new GetOrderRequestsResponse(
            response,
            totalCount,
            page,
            pageSize,
            totalPages));
    }
}
