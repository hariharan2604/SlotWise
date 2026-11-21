using SlotWise.Api.Dtos;

namespace SlotWise.Api.Services;

public sealed record AuthSession(string Token, DateTimeOffset ExpiresAt, AuthResponse User);
