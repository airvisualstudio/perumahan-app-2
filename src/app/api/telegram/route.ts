import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage, formatSlackToTelegramHtml } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, botToken, chatId, message, channel, enabled } = body;
    const data = db.get();

    if (action === 'save_settings') {
      const currentSettings = data.settings || {
        org_name: 'PT Domus Somnia Properti',
        org_logo: '',
        timezone: 'Asia/Jakarta',
        office_locations: [],
        late_threshold_minutes: 15,
        work_hours_start: '09:00',
        work_hours_end: '18:00'
      };

      data.settings = {
        ...currentSettings,
        telegram_bot_token: botToken !== undefined ? botToken : currentSettings.telegram_bot_token,
        telegram_chat_id: chatId !== undefined ? chatId : currentSettings.telegram_chat_id,
        telegram_enabled: enabled !== undefined ? enabled : currentSettings.telegram_enabled,
      };

      db.save(data);
      return NextResponse.json({ success: true, settings: data.settings });
    }

    if (action === 'send_test') {
      const testMessage = `<b>🤖 UJI COBA TELEGRAM BOT</b>\n\nKoneksi Telegram Bot dengan <b>Domus CRM & Operasional Perumahan</b> berhasil dikonfigurasi!\n\n📅 Waktu: ${new Date().toLocaleString('id-ID')}\n✅ Status: <i>Online & Siap Mengirim Log Real-Time</i>`;
      const result = await sendTelegramMessage({
        message: testMessage,
        chatId: chatId || undefined,
        botToken: botToken || undefined,
        parseMode: 'HTML'
      });

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Pesan uji coba berhasil terkirim ke Telegram!' });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }

    if (action === 'send_log') {
      if (!message) {
        return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
      }

      const formattedHtml = formatSlackToTelegramHtml(message, channel);
      const result = await sendTelegramMessage({
        message: formattedHtml,
        parseMode: 'HTML'
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Telegram API Route Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
