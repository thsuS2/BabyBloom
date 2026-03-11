import {
  Controller, Get, Post, Patch, Delete, Body, Req, UseGuards,
} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('partner')
@UseGuards(AuthGuard)
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Post('invite')
  createInviteCode(@Req() req) {
    return this.partnerService.createInviteCode(req.user.id);
  }

  @Post('connect')
  connect(@Req() req, @Body('code') code: string) {
    return this.partnerService.connectByCode(req.user.id, code);
  }

  @Get()
  getPartner(@Req() req) {
    return this.partnerService.getPartner(req.user.id);
  }

  @Patch('categories')
  updateCategories(@Req() req, @Body('categories') categories: string[]) {
    return this.partnerService.updateSharedCategories(req.user.id, categories);
  }

  @Delete()
  disconnect(@Req() req) {
    return this.partnerService.disconnect(req.user.id);
  }
}
