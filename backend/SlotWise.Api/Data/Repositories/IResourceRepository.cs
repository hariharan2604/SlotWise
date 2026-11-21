using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public interface IResourceRepository
{
    Task<IReadOnlyList<Resource>> GetActiveAsync(CancellationToken cancellationToken);
    Task AddAsync(Resource resource, CancellationToken cancellationToken);
}
