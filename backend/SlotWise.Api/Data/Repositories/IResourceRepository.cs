using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public interface IResourceRepository
{
    Task<IReadOnlyList<Resource>> GetActiveAsync(CancellationToken cancellationToken);
    Task<Resource?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<OfficeLocation?> GetActiveOfficeAsync(int officeLocationId, CancellationToken cancellationToken);
    Task AddAsync(Resource resource, CancellationToken cancellationToken);
    Task<Resource?> AssignOfficeAsync(
        int resourceId,
        int? officeLocationId,
        ExistingBookingOfficeChange? existingBookingsAction,
        DateTime nowUtc,
        CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
