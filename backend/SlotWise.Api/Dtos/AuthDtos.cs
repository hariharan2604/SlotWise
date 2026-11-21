namespace SlotWise.Api.Dtos;

public record RegisterRequest(string DisplayName, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Email, string DisplayName, string Role);
