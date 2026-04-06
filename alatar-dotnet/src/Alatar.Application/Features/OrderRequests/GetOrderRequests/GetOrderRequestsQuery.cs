using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.GetOrderRequests;

public sealed record GetOrderRequestsQuery(
    int Page,
    int PageSize) : IRequest<Result<GetOrderRequestsResponse>>;
