import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { CycleService } from './cycle.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cycle')
@UseGuards(AuthGuard)
export class CycleController {
  constructor(private cycleService: CycleService) {}

  @Post()
  create(
    @Req() req,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate?: string,
  ) {
    return this.cycleService.create(req.user.id, startDate, endDate);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body('endDate') endDate: string,
  ) {
    return this.cycleService.update(req.user.id, id, endDate);
  }

  @Get()
  getAll(@Req() req) {
    return this.cycleService.getAll(req.user.id);
  }

  @Get('latest')
  getLatest(@Req() req) {
    return this.cycleService.getLatest(req.user.id);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    return this.cycleService.delete(req.user.id, id);
  }
}
