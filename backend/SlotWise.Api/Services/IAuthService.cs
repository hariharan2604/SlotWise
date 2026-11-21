using SlotWise.Api.Dtos;

namespace SlotWise.Api.Services;

public interface IAuthService
{
    Task<AuthSession> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthSession?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResponse?> GetCurrentUserAsync(string userId, CancellationToken cancellationToken);
}
