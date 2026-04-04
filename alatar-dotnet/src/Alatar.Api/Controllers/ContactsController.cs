using Alatar.Api.Common;
using Alatar.Api.Contracts.Contacts;
using Alatar.Api.Security;
using Alatar.Application.Features.Contacts.AddContact;
using Alatar.Application.Features.Contacts.DeleteContact;
using Alatar.Application.Features.Contacts.GetContacts;
using Alatar.Application.Features.Contacts.UpdateContactStatus;
using Alatar.Domain.Contacts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Controllers;

[ApiController]
[Route("api/contacts")]
public sealed class ContactsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(
        [FromBody] CreateContactRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddContactCommand(
            request.FullName,
            request.PhoneNumber,
            (ContactServiceType)request.ServiceType,
            request.CompanyName,
            request.Country,
            request.Crop,
            request.QuantityTons,
            request.DeliveryWindow,
            request.Notes);

        var result = await sender.Send(command, cancellationToken);

        return this.ToActionResult(result, contactId =>
            Created($"/api/contacts/{contactId}", new ContactIdResponse(contactId)));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetContactsQuery(page, pageSize), cancellationToken);
        return this.ToActionResult(result, Ok);
    }

    [HttpPut("{contactId:guid}/status")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateStatus(
        [FromRoute] Guid contactId,
        [FromBody] UpdateContactStatusRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateContactStatusCommand(
            contactId,
            (ContactLeadStatus)request.Status);

        var result = await sender.Send(command, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpDelete("{contactId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(
        [FromRoute] Guid contactId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteContactCommand(contactId), cancellationToken);
        return this.ToActionResult(result);
    }
}
