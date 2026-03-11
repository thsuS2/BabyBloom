import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 465,
        secure: (port ? Number(port) : 465) === 465,
        auth: { user, pass },
      });
    }
  }

  async sendVerificationCode(toEmail: string, code: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env');
    }
    const from = this.configService.get<string>('SMTP_USER') || 'noreply@babybloom.app';
    await this.transporter.sendMail({
      from: `"BabyBloom" <${from}>`,
      to: toEmail,
      subject: '[BabyBloom] 이메일 인증 코드',
      text: `BabyBloom 이메일 인증 코드입니다.\n\n인증 코드: ${code}\n\n5분 내에 입력해 주세요.`,
      html: `
        <p>BabyBloom 이메일 인증 코드입니다.</p>
        <p><strong>인증 코드: ${code}</strong></p>
        <p>5분 내에 입력해 주세요.</p>
      `,
    });
  }
}
