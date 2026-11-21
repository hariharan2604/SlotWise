using SlotWise.Api.Models;

namespace SlotWise.Api.Data.Repositories;

public interface IBookingRepository
{
    Task<Booking?> CreateIfAvailableAsync(Booking booking, CancellationToken cancellationToken);
    Task<IReadOnlyList<Booking>> GetForUserAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Booking>> GetAllAsync(CancellationToken cancellationToken);
    Task<Booking?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> HasActiveResourceAsync(int resourceId, CancellationToken cancellationToken);
    Task<bool> HasConfirmedOverlapAsync(
        int resourceId,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<int>> GetAvailableResourceIdsAsync(
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
