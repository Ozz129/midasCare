import { type AuthMeResponse, type AuthSessionResponse } from '@care/api-contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { type CookieOptions, type Request, type Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../common/types/request-context';
import { APP_CONFIG } from '../../config/app-config.module';
import { type AppConfig } from '../../config/environment';
import { readCookie, REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants';
import { AuthService, type IssuedSession, type RequestMetadata } from './auth.service';
import {
  AuthSessionResponseDto,
  LoginDto,
  RegisterDto,
  UserProfileResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Crear cuenta',
    description:
      'Crea el usuario, su espacio de trabajo individual y su membresía de propietario. Inicia sesión y entrega el refresh token en una cookie httpOnly.',
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiConflictResponse({ description: 'Ya existe una cuenta con ese correo.' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos.' })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    return this.respond(response, await this.authService.register(dto, this.metadata(request)));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos.' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos.' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    return this.respond(response, await this.authService.login(dto, this.metadata(request)));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Renovar sesión',
    description: 'Usa la cookie de refresh, la rota y devuelve un nuevo access token.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inexistente, expirada o revocada.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    try {
      return this.respond(response, await this.authService.refresh(this.refreshCookie(request)));
    } catch (error) {
      response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Revoca la sesión y borra la cookie.' })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.refreshCookie(request), this.metadata(request));
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario autenticado' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiUnauthorizedResponse()
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthMeResponse> {
    return this.authService.me(user.id);
  }

  private respond(response: Response, issued: IssuedSession): AuthSessionResponse {
    response.cookie(REFRESH_COOKIE_NAME, issued.refreshToken, {
      ...this.cookieOptions(),
      expires: issued.refreshExpiresAt,
    });
    // Las respuestas con tokens nunca deben almacenarse en caché.
    response.setHeader('Cache-Control', 'no-store');
    return issued.response;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.auth.secureCookies,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    };
  }

  private refreshCookie(request: Request): string | undefined {
    return readCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
  }

  private metadata(request: Request): RequestMetadata {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
