using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public sealed class AuthService(
    UserManager<ApplicationUser> users,
    IConfiguration configuration) : IAuthService
{
    public async Task<AuthSession> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 100)
            throw new ArgumentException("A valid display name is required.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName.Trim()
        };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join("; ", result.Errors.Select(error => error.Description)));

        cancellationToken.ThrowIfCancellationRequested();
        var roleResult = await users.AddToRoleAsync(user, "User");
        if (!roleResult.Succeeded)
        {
            await users.DeleteAsync(user);
            throw new ArgumentException(string.Join("; ", roleResult.Errors.Select(error => error.Description)));
        }

        return await CreateTokenAsync(user, cancellationToken);
    }

    public async Task<AuthSession?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null || !await users.CheckPasswordAsync(user, request.Password))
            return null;

        return await CreateTokenAsync(user, cancellationToken);
    }

    public async Task<AuthResponse?> GetCurrentUserAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId);
        if (user is null)
            return null;

        var roles = await users.GetRolesAsync(user);
        return new AuthResponse(user.Email ?? "", user.DisplayName, roles.FirstOrDefault() ?? "User");
    }

    private async Task<AuthSession> CreateTokenAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var roles = await users.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.DisplayName)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var expiresAt = DateTimeOffset.UtcNow.AddHours(3);
        var token = new JwtSecurityToken(
            configuration["Jwt:Issuer"],
            configuration["Jwt:Audience"],
            claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthSession(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt,
            new AuthResponse(user.Email!, user.DisplayName, roles.FirstOrDefault() ?? "User"));
    }
}
