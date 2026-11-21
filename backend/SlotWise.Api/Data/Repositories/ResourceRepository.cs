using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public sealed class ResourceRepository(AppDbContext db) : IResourceRepository
{
    public async Task<IReadOnlyList<Resource>> GetActiveAsync(CancellationToken cancellationToken) =>
        await db.Resources.AsNoTracking()
            .Where(resource => resource.IsActive)
            .OrderBy(resource => resource.Name)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Resource resource, CancellationToken cancellationToken)
    {
        db.Resources.Add(resource);
        await db.SaveChangesAsync(cancellationToken);
    }
}
