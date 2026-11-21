using System.Data;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public sealed class BookingRepository(AppDbContext db) : IBookingRepository
{
    public async Task<Booking?> CreateIfAvailableAsync(Booking booking, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var resource = await db.Resources.SingleOrDefaultAsync(
            item => item.Id == booking.ResourceId && item.IsActive,
            cancellationToken)
            ?? throw new KeyNotFoundException("Resource not found or inactive.");

        var overlaps = await db.Bookings.AnyAsync(item =>
            item.ResourceId == booking.ResourceId &&
            item.Status == BookingStatus.Confirmed &&
            item.StartUtc < booking.EndUtc &&
            item.EndUtc > booking.StartUtc,
            cancellationToken);
        if (overlaps)
            return null;

        booking.Resource = resource;
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return booking;
    }

    public async Task<IReadOnlyList<Booking>> GetForUserAsync(
        string userId,
        CancellationToken cancellationToken) =>
        await db.Bookings.AsNoTracking()
            .Include(booking => booking.Resource)
            .Include(booking => booking.User)
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.StartUtc)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Booking>> GetAllAsync(CancellationToken cancellationToken) =>
        await db.Bookings.AsNoTracking()
            .Include(booking => booking.Resource)
            .Include(booking => booking.User)
            .OrderByDescending(booking => booking.StartUtc)
            .ToListAsync(cancellationToken);

    public Task<Booking?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Bookings.SingleOrDefaultAsync(booking => booking.Id == id, cancellationToken);

    public Task<bool> HasActiveResourceAsync(int resourceId, CancellationToken cancellationToken) =>
        db.Resources.AnyAsync(
            resource => resource.Id == resourceId && resource.IsActive,
            cancellationToken);

    public Task<bool> HasConfirmedOverlapAsync(
        int resourceId,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken) =>
        db.Bookings.AnyAsync(booking =>
            booking.ResourceId == resourceId &&
            booking.Status == BookingStatus.Confirmed &&
            booking.StartUtc < endUtc &&
            booking.EndUtc > startUtc,
            cancellationToken);

    public async Task<IReadOnlyList<int>> GetAvailableResourceIdsAsync(
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken) =>
        await db.Resources.AsNoTracking()
            .Where(resource => resource.IsActive && !db.Bookings.Any(booking =>
                booking.ResourceId == resource.Id &&
                booking.Status == BookingStatus.Confirmed &&
                booking.StartUtc < endUtc &&
                booking.EndUtc > startUtc))
            .OrderBy(resource => resource.Name)
            .Select(resource => resource.Id)
            .ToListAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        db.SaveChangesAsync(cancellationToken);
}
