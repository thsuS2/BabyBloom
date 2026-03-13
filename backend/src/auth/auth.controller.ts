import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto, SignUpDto, SignInDto, ResetPasswordDto } from './auth.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-signup-code')
  sendSignUpCode(@Body() dto: SendCodeDto) {
    return this.authService.sendSignUpCode(dto.email);
  }

  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password, dto.code, dto.nickname);
  }

  @Post('signin')
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.email, dto.password);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @Post('signout')
  signOut(@Body('refreshToken') refreshToken: string) {
    return this.authService.signOut(refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req) {
    return this.authService.getMe(req.user.id);
  }
}
