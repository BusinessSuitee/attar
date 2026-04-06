using Alatar.Application.Common.Results;
using Alatar.Domain.OrderRequests;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.UpdateOrderRequestStatus;

public sealed record UpdateOrderRequestStatusCommand(
    Guid OrderRequestId,
    OrderRequestStatus Status) : IRequest<Result>;
