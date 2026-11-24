using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public interface IResourceService
{
    Task<IReadOnlyList<ResourceResponse>> GetActiveAsync(CancellationToken cancellationToken);
    Task<ResourceResponse> CreateAsync(ResourceRequest request, CancellationToken cancellationToken);
    Task<ResourceResponse> AssignOfficeAsync(
        int resourceId,
        int? officeLocationId,
        ExistingBookingOfficeChange? existingBookingsAction,
        CancellationToken cancellationToken);
}
