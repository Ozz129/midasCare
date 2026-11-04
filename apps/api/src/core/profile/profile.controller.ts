import { AVATAR_MAX_BYTES, type MyProfileResponse, SIGNATURE_MAX_BYTES } from '@care/api-contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../common/types/request-context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyProfileResponseDto, UpdateMyProfileDto } from './dto/profile.dto';
import { type ProfileImageKind, ProfileService } from './profile.service';

const uploadBody = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: { file: { type: 'string', format: 'binary' } },
  },
};

/** Opciones de multer: en memoria, un solo archivo, tamaño máximo por tipo. */
const uploadOptions = (maxBytes: number) => ({
  limits: { fileSize: maxBytes, files: 1, fields: 0 },
});

@ApiTags('perfil')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Mi perfil', description: 'Datos personales y perfil profesional.' })
  @ApiOkResponse({ type: MyProfileResponseDto })
  get(@CurrentUser() user: AuthenticatedUser): Promise<MyProfileResponse> {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiOkResponse({ type: MyProfileResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<MyProfileResponse> {
    return this.profileService.update(user.id, dto);
  }

  // ---- Foto de perfil ------------------------------------------------------

  @Put('avatar')
  @UseInterceptors(FileInterceptor('file', uploadOptions(AVATAR_MAX_BYTES)))
  @ApiOperation({ summary: 'Subir foto de perfil', description: 'PNG, JPG o WebP, máx. 2 MB.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOkResponse({ type: MyProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Formato no permitido.' })
  @ApiPayloadTooLargeResponse()
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<MyProfileResponse> {
    return this.profileService.setImage('avatar', user.id, file?.buffer);
  }

  @Get('avatar')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Obtener mi foto de perfil' })
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiNotFoundResponse()
  getAvatar(@CurrentUser() user: AuthenticatedUser): Promise<StreamableFile> {
    return this.streamImage('avatar', user.id);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Eliminar mi foto de perfil' })
  @ApiOkResponse({ type: MyProfileResponseDto })
  deleteAvatar(@CurrentUser() user: AuthenticatedUser): Promise<MyProfileResponse> {
    return this.profileService.deleteImage('avatar', user.id);
  }

  // ---- Firma ----------------------------------------------------------------

  @Put('signature')
  @UseInterceptors(FileInterceptor('file', uploadOptions(SIGNATURE_MAX_BYTES)))
  @ApiOperation({
    summary: 'Subir mi firma',
    description:
      'Imagen de la firma: PNG (recomendado, con fondo transparente), JPG o WebP. Máx. 1 MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOkResponse({ type: MyProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Formato no permitido.' })
  @ApiPayloadTooLargeResponse()
  uploadSignature(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<MyProfileResponse> {
    return this.profileService.setImage('signature', user.id, file?.buffer);
  }

  @Get('signature')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Obtener mi firma', description: 'Solo accesible por su dueño.' })
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiNotFoundResponse()
  getSignature(@CurrentUser() user: AuthenticatedUser): Promise<StreamableFile> {
    return this.streamImage('signature', user.id);
  }

  @Delete('signature')
  @ApiOperation({ summary: 'Eliminar mi firma' })
  @ApiOkResponse({ type: MyProfileResponseDto })
  deleteSignature(@CurrentUser() user: AuthenticatedUser): Promise<MyProfileResponse> {
    return this.profileService.deleteImage('signature', user.id);
  }

  private async streamImage(kind: ProfileImageKind, userId: string): Promise<StreamableFile> {
    const { stream, mimeType } = await this.profileService.getImage(kind, userId);
    return new StreamableFile(stream, { type: mimeType, disposition: 'inline' });
  }
}
