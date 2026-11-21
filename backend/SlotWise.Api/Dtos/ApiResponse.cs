namespace SlotWise.Api.Dtos;

/// <summary>Provides a consistent envelope for successful API responses.</summary>
public sealed record ApiResponse<T>(bool Success, string Message, T Data);
