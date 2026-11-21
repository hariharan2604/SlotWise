using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotWise.Api.Dtos;
using SlotWise.Api.Security;
using SlotWise.Api.Services;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var session = await auth.RegisterAsync(request, cancellationToken);
        SetAuthCookie(session);
        return Ok(new ApiResponse<AuthResponse>(true, "Registration successful.", session.User));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var session = await auth.LoginAsync(request, cancellationToken);
        if (session is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized",
                detail: "Invalid email or password.");
        SetAuthCookie(session);
        return Ok(new ApiResponse<AuthResponse>(true, "Login successful.", session.User));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Unauthorized();
        var user = await auth.GetCurrentUserAsync(userId, cancellationToken);
        return user is null
            ? Unauthorized()
            : Ok(new ApiResponse<AuthResponse>(true, "Session retrieved successfully.", user));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(AuthCookieDefaults.Name, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });
        return NoContent();
    }

    private void SetAuthCookie(AuthSession session)
    {
        Response.Cookies.Append(AuthCookieDefaults.Name, session.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = session.ExpiresAt,
            IsEssential = true
        });
    }
}
