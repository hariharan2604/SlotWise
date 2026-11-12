using System.Data;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Data;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public class BookingService(AppDbContext db)
{
    public async Task<BookingResponse> CreateAsync(string userId, CreateBookingRequest request, CancellationToken ct)
    {
        if (request.Start.Offset != TimeSpan.Zero || request.End.Offset != TimeSpan.Zero)
            throw new ArgumentException("Send Start and End in UTC (ISO 8601 ending in Z).");
        ValidateInterval(request.Start, request.End);
        var start = request.Start.UtcDateTime;
        var end = request.End.UtcDateTime;

        // Serializable isolation prevents two concurrent requests from both passing the overlap check.
        // Keep the ResourceId/StartUtc/EndUtc index in AppDbContext for efficient range locking.
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var resource = await db.Resources.SingleOrDefaultAsync(r => r.Id == request.ResourceId && r.IsActive, ct)
            ?? throw new KeyNotFoundException("Resource not found or inactive.");

        var overlaps = await db.Bookings.AnyAsync(b =>
            b.ResourceId == request.ResourceId &&
            b.Status == BookingStatus.Confirmed &&
            b.StartUtc < end && b.EndUtc > start, ct);
        if (overlaps) throw new InvalidOperationException("This resource is already booked for the selected time.");

        var user = await db.Users.FindAsync([userId], ct);
        var booking = new Booking {
            ResourceId = resource.Id, UserId = userId, Purpose = request.Purpose.Trim(),
            StartUtc = start, EndUtc = end, Status = BookingStatus.Confirmed
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return new BookingResponse(booking.Id, resource.Id, resource.Name, booking.Purpose,
            booking.StartUtc, booking.EndUtc, booking.Status.ToString(), user?.DisplayName ?? "");
    }

    public async Task<List<BookingResponse>> ForUserAsync(string userId, CancellationToken ct)
    {
        var bookings = await db.Bookings.AsNoTracking().Where(b => b.UserId == userId)
            .OrderByDescending(b => b.StartUtc)
            .Select(b => new BookingResponse(b.Id, b.ResourceId, b.Resource!.Name, b.Purpose,
                b.StartUtc, b.EndUtc, b.Status.ToString(), b.User!.DisplayName))
            .ToListAsync(ct);
        return bookings.Select(WithUtcTimestamps).ToList();
    }

    public async Task<List<BookingResponse>> AllAsync(CancellationToken ct)
    {
        var bookings = await db.Bookings.AsNoTracking().OrderByDescending(b => b.StartUtc)
            .Select(b => new BookingResponse(b.Id, b.ResourceId, b.Resource!.Name, b.Purpose,
                b.StartUtc, b.EndUtc, b.Status.ToString(), b.User!.DisplayName))
            .ToListAsync(ct);
        return bookings.Select(WithUtcTimestamps).ToList();
    }

    private static BookingResponse WithUtcTimestamps(BookingResponse booking) => booking with
    {
        StartUtc = DateTime.SpecifyKind(booking.StartUtc, DateTimeKind.Utc),
        EndUtc = DateTime.SpecifyKind(booking.EndUtc, DateTimeKind.Utc)
    };

    public async Task CancelAsync(int id, string userId, bool isAdmin, CancellationToken ct)
    {
        var booking = await db.Bookings.SingleOrDefaultAsync(b => b.Id == id, ct)
            ?? throw new KeyNotFoundException("Booking not found.");
        if (!isAdmin && booking.UserId != userId) throw new UnauthorizedAccessException("You can only cancel your own bookings.");
        if (booking.Status == BookingStatus.Cancelled) return;
        if (booking.StartUtc <= DateTime.UtcNow) throw new InvalidOperationException("Started bookings cannot be cancelled.");
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> IsAvailableAsync(int resourceId, DateTimeOffset start, DateTimeOffset end, CancellationToken ct)
    {
        if (resourceId <= 0) throw new ArgumentException("A valid resource is required.");
        ValidateInterval(start, end);
        var resourceIsActive = await db.Resources.AnyAsync(r => r.Id == resourceId && r.IsActive, ct);
        if (!resourceIsActive) throw new KeyNotFoundException("Resource not found or inactive.");

        var exists = await db.Bookings.AnyAsync(b => b.ResourceId == resourceId &&
            b.Status == BookingStatus.Confirmed && b.StartUtc < end.UtcDateTime && b.EndUtc > start.UtcDateTime, ct);
        return !exists;
    }

    public async Task<List<int>> AvailableResourceIdsAsync(DateTimeOffset start, DateTimeOffset end, CancellationToken ct)
    {
        ValidateInterval(start, end);
        var startUtc = start.UtcDateTime;
        var endUtc = end.UtcDateTime;

        return await db.Resources.AsNoTracking()
            .Where(r => r.IsActive && !db.Bookings.Any(b =>
                b.ResourceId == r.Id &&
                b.Status == BookingStatus.Confirmed &&
                b.StartUtc < endUtc && b.EndUtc > startUtc))
            .OrderBy(r => r.Name)
            .Select(r => r.Id)
            .ToListAsync(ct);
    }

    private static void ValidateInterval(DateTimeOffset start, DateTimeOffset end)
    {
        if (end <= start) throw new ArgumentException("End time must be after start time.");
        if (start <= DateTimeOffset.UtcNow) throw new ArgumentException("Bookings must start in the future.");
        if ((end - start) > TimeSpan.FromHours(12)) throw new ArgumentException("A booking cannot exceed 12 hours.");
    }
}
