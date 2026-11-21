using SlotWise.Api.Dtos;

namespace SlotWise.Api.Services;

public interface IBookingService
{
    Task<BookingResponse> CreateAsync(
        string userId,
        CreateBookingRequest request,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<BookingResponse>> ForUserAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<BookingResponse>> AllAsync(CancellationToken cancellationToken);
    Task CancelAsync(int id, string userId, bool isAdmin, CancellationToken cancellationToken);
    Task<bool> IsAvailableAsync(
        int resourceId,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<int>> AvailableResourceIdsAsync(
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken);
}
