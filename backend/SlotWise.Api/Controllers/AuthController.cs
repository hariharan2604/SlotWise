using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<ApplicationUser> users, IConfiguration config) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "A valid display name is required.");
        var user = new ApplicationUser { UserName = request.Email, Email = request.Email, DisplayName = request.DisplayName.Trim() };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: string.Join("; ", result.Errors.Select(e => e.Description)));
        await users.AddToRoleAsync(user, "User");
        return Ok(new ApiResponse<AuthResponse>(true, "Registration successful.", await CreateToken(user)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null || !await users.CheckPasswordAsync(user, request.Password))
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized",
                detail: "Invalid email or password.");
        return Ok(new ApiResponse<AuthResponse>(true, "Login successful.", await CreateToken(user)));
    }

    private async Task<AuthResponse> CreateToken(ApplicationUser user)
    {
        var roles = await users.GetRolesAsync(user);
        var claims = new List<Claim> {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.DisplayName)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var token = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims,
            expires: DateTime.UtcNow.AddHours(3), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), user.Email!, user.DisplayName, roles.FirstOrDefault() ?? "User");
    }
}
