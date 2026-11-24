using System.Data;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public sealed class ResourceRepository(AppDbContext db) : IResourceRepository
{
    public async Task<IReadOnlyList<Resource>> GetActiveAsync(CancellationToken cancellationToken) =>
        await db.Resources.AsNoTracking()
            .Where(resource => resource.IsActive &&
                (!resource.OfficeLocationId.HasValue || resource.OfficeLocation!.IsActive))
            .OrderBy(resource => resource.Name)
            .ToListAsync(cancellationToken);

    public Task<OfficeLocation?> GetActiveOfficeAsync(int officeLocationId, CancellationToken cancellationToken) =>
        db.OfficeLocations.AsNoTracking()
            .FirstOrDefaultAsync(office => office.Id == officeLocationId && office.IsActive, cancellationToken);

    public Task<Resource?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Resources.FirstOrDefaultAsync(resource => resource.Id == id, cancellationToken);

    public async Task AddAsync(Resource resource, CancellationToken cancellationToken)
    {
        db.Resources.Add(resource);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Resource?> AssignOfficeAsync(
        int resourceId,
        int? officeLocationId,
        ExistingBookingOfficeChange? existingBookingsAction,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        var resource = await db.Resources.SingleOrDefaultAsync(
            item => item.Id == resourceId, cancellationToken);
        if (resource is null)
            return null;

        if (officeLocationId.HasValue && !await db.OfficeLocations.AnyAsync(
                office => office.Id == officeLocationId.Value && office.IsActive,
                cancellationToken))
            throw new ArgumentException("The selected office location does not exist or is inactive.");

        if (resource.OfficeLocationId == officeLocationId)
        {
            await transaction.CommitAsync(cancellationToken);
            return resource;
        }

        var futureBookings = await db.Bookings
            .Where(booking => booking.ResourceId == resourceId &&
                booking.Status == BookingStatus.Confirmed &&
                booking.StartUtc > nowUtc)
            .ToListAsync(cancellationToken);
        if (futureBookings.Count > 0 && existingBookingsAction is null)
            throw new InvalidOperationException(
                $"This resource has {futureBookings.Count} future booking(s). Choose whether to move them with the resource or cancel them.");

        if (existingBookingsAction == ExistingBookingOfficeChange.Cancel)
        {
            foreach (var booking in futureBookings)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.CancelledAtUtc = nowUtc;
            }
        }

        resource.OfficeLocationId = officeLocationId;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return resource;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        db.SaveChangesAsync(cancellationToken);
}
