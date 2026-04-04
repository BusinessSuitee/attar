using Alatar.Application.Common.Results;
using Alatar.Domain.Contacts;
using MediatR;

namespace Alatar.Application.Features.Contacts.AddContact;

public sealed record AddContactCommand(
    string FullName,
    string PhoneNumber,
    ContactServiceType ServiceType,
    string? CompanyName,
    string? Country,
    string? Crop,
    decimal? QuantityTons,
    string? DeliveryWindow,
    string? Notes) : IRequest<Result<Guid>>;
