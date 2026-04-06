using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.DeleteOrderRequest;

public sealed record DeleteOrderRequestCommand(Guid OrderRequestId) : IRequest<Result>;