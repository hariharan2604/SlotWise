using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public interface IOfficeLocationRepository
{
    Task<IReadOnlyList<OfficeLocation>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<OfficeLocation?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Resource>> GetActiveResourcesAsync(int officeLocationId, CancellationToken cancellationToken);
    Task AddAsync(OfficeLocation office, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
