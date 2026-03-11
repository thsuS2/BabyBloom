import {
  Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('logs')
@UseGuards(AuthGuard)
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get('types')
  getLogTypes() {
    return this.logsService.getLogTypes();
  }

  @Get('settings')
  getUserLogSettings(@Req() req) {
    return this.logsService.getUserLogSettings(req.user.id);
  }

  @Post('settings')
  toggleLogSetting(
    @Req() req,
    @Body('logTypeId') logTypeId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.logsService.toggleLogSetting(req.user.id, logTypeId, isActive);
  }

  @Post('entry')
  saveEntry(
    @Req() req,
    @Body('logTypeId') logTypeId: string,
    @Body('date') date: string,
    @Body('value') value: string,
  ) {
    return this.logsService.saveEntry(req.user.id, logTypeId, date, value);
  }

  @Post('bulk')
  saveBulkEntries(
    @Req() req,
    @Body('date') date: string,
    @Body('entries') entries: { logTypeId: string; value: string }[],
  ) {
    return this.logsService.saveBulkEntries(req.user.id, date, entries);
  }

  @Get('date/:date')
  getByDate(@Req() req, @Param('date') date: string) {
    return this.logsService.getEntriesByDate(req.user.id, date);
  }

  @Get('range')
  getByRange(
    @Req() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.logsService.getEntriesByRange(req.user.id, start, end);
  }

  @Delete(':id')
  deleteEntry(@Req() req, @Param('id') id: string) {
    return this.logsService.deleteEntry(req.user.id, id);
  }
}
