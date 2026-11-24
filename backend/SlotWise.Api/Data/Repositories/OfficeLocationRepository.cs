using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public sealed class OfficeLocationRepository(AppDbContext db) : IOfficeLocationRepository
{
    public async Task<IReadOnlyList<OfficeLocation>> GetAllAsync(
        bool includeInactive,
        CancellationToken cancellationToken)
    {
        var query = db.OfficeLocations.AsNoTracking()
            .Include(office => office.Resources.Where(resource => resource.IsActive));
        if (!includeInactive)
            query = query.Where(office => office.IsActive)
                .Include(office => office.Resources.Where(resource => resource.IsActive));

        return await query.OrderBy(office => office.Name).ToListAsync(cancellationToken);
    }

    public Task<OfficeLocation?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.OfficeLocations.Include(office => office.Resources.Where(resource => resource.IsActive))
            .FirstOrDefaultAsync(office => office.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Resource>> GetActiveResourcesAsync(
        int officeLocationId,
        CancellationToken cancellationToken) =>
        await db.Resources.AsNoTracking()
            .Where(resource => resource.OfficeLocationId == officeLocationId && resource.IsActive)
            .OrderBy(resource => resource.Name)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(OfficeLocation office, CancellationToken cancellationToken)
    {
        db.OfficeLocations.Add(office);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        db.SaveChangesAsync(cancellationToken);
}
