import { db } from './db';

export interface TelegramMessageOptions {
  message: string;
  chatId?: string;
  botToken?: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export async function sendTelegramMessage(options: TelegramMessageOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const data = db.get();
    const settings = data.settings || {};

    const botToken = options.botToken || settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = options.chatId || settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
    const isEnabled = settings.telegram_enabled !== false;

    if (!isEnabled && !options.botToken) {
      return { success: false, error: 'Notifikasi Telegram dinonaktifkan dalam pengaturan.' };
    }

    if (!botToken || !chatId) {
      return { success: false, error: 'Telegram Bot Token atau Chat ID belum dikonfigurasi.' };
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: options.message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const json = await response.json();
    if (json.ok) {
      return { success: true };
    } else {
      return { success: false, error: json.description || 'Gagal mengirim pesan ke Telegram API.' };
    }
  } catch (error: any) {
    console.error('Telegram Notification Error:', error);
    return { success: false, error: error?.message || 'Terjadi kesalahan saat menghubungi Telegram API.' };
  }
}

export function formatSlackToTelegramHtml(slackMessage: string, channelName?: string): string {
  // Convert markdown bold *text* to <b>text</b>
  let html = slackMessage.replace(/\*(.*?)\*/g, '<b>$1</b>');

  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const channelBadge = channelName ? `[#${channelName}]` : '[LOG SISTEM]';

  return `<b>🤖 DOMUS NOTIF</b> ${channelBadge} - <i>${timestamp}</i>\n\n${html}`;
}
