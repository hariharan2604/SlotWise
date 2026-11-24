using Microsoft.AspNetCore.Identity;
using SlotWise.Api.Data.Repositories;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public sealed class BookingService(
    IBookingRepository bookings,
    UserManager<ApplicationUser> users) : IBookingService
{
    public async Task<BookingResponse> CreateAsync(
        string userId,
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Purpose) || request.Purpose.Length > 300)
            throw new ArgumentException("Purpose is required (maximum 300 characters).");
        if (request.Start.Offset != TimeSpan.Zero || request.End.Offset != TimeSpan.Zero)
            throw new ArgumentException("Send Start and End in UTC (ISO 8601 ending in Z).");
        ValidateInterval(request.Start, request.End);

        var booking = new Booking
        {
            ResourceId = request.ResourceId,
            UserId = userId,
            Purpose = request.Purpose.Trim(),
            StartUtc = request.Start.UtcDateTime,
            EndUtc = request.End.UtcDateTime,
            Status = BookingStatus.Confirmed
        };
        var createdBooking = await bookings.CreateIfAvailableAsync(booking, cancellationToken)
            ?? throw new InvalidOperationException("This resource is already booked for the selected time.");
        var user = await users.FindByIdAsync(userId);

        return ToResponse(createdBooking, user?.DisplayName ?? "");
    }

    public async Task<IReadOnlyList<BookingResponse>> ForUserAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var results = await bookings.GetForUserAsync(userId, cancellationToken);
        return results.Select(booking => ToResponse(booking, booking.User?.DisplayName ?? "")).ToList();
    }

    public async Task<IReadOnlyList<BookingResponse>> AllAsync(CancellationToken cancellationToken)
    {
        var results = await bookings.GetAllAsync(cancellationToken);
        return results.Select(booking => ToResponse(booking, booking.User?.DisplayName ?? "")).ToList();
    }

    public async Task CancelAsync(
        int id,
        string userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var booking = await bookings.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");
        if (!isAdmin && booking.UserId != userId)
            throw new UnauthorizedAccessException("You can only cancel your own bookings.");
        if (booking.Status == BookingStatus.Cancelled)
            return;
        if (booking.StartUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Started bookings cannot be cancelled.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = DateTime.UtcNow;
        await bookings.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsAvailableAsync(
        int resourceId,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        if (resourceId <= 0)
            throw new ArgumentException("A valid resource is required.");
        ValidateInterval(start, end);

        if (!await bookings.HasActiveResourceAsync(resourceId, cancellationToken))
            throw new KeyNotFoundException("Resource not found or inactive.");

        return !await bookings.HasConfirmedOverlapAsync(
            resourceId,
            start.UtcDateTime,
            end.UtcDateTime,
            cancellationToken);
    }

    public async Task<IReadOnlyList<int>> AvailableResourceIdsAsync(
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        ValidateInterval(start, end);
        return await bookings.GetAvailableResourceIdsAsync(
            start.UtcDateTime,
            end.UtcDateTime,
            cancellationToken);
    }

    private static BookingResponse ToResponse(Booking booking, string bookedBy) =>
        new(
            booking.Id,
            booking.ResourceId,
            booking.Resource!.Name,
            booking.Purpose,
            DateTime.SpecifyKind(booking.StartUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(booking.EndUtc, DateTimeKind.Utc),
            booking.Status.ToString(),
            bookedBy,
            booking.Resource?.OfficeLocation?.Name);

    private static void ValidateInterval(DateTimeOffset start, DateTimeOffset end)
    {
        if (end <= start)
            throw new ArgumentException("End time must be after start time.");
        if (start <= DateTimeOffset.UtcNow)
            throw new ArgumentException("Bookings must start in the future.");
        if ((end - start) > TimeSpan.FromHours(12))
            throw new ArgumentException("A booking cannot exceed 12 hours.");
    }
}
