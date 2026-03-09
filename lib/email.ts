/**
 * Email service using Resend
 * Used for excavation report delivery and notifications
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ResendResponse {
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Sorca <noreply@sorca.life>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data: ResendResponse = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true, id: data.id };
  } catch (e) {
    console.error('Email send failed:', e);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Send excavation report email
 */
export async function sendExcavationReportEmail(
  to: string,
  userName: string,
  reportMonth: string,
  reportData: {
    narrative: string;
    questionOfTheMonth: string;
    stats: {
      totalSessions: number;
      avgDepth: number;
      maxDepth: number;
      deepestTheme: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Monthly Excavation Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border: 1px solid #222; border-radius: 8px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #222;">
              <h1 style="margin: 0; color: #0f766e; font-size: 28px; letter-spacing: 0.2em; font-weight: normal;">SORCA</h1>
              <p style="margin: 10px 0 0; color: #666; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Monthly Excavation Report</p>
              <p style="margin: 5px 0 0; color: #888; font-size: 14px;">${escapeHtml(reportMonth)}</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #ccc; font-size: 16px; line-height: 1.6;">
                Dear ${escapeHtml(userName)},
              </p>
              <p style="margin: 15px 0 0; color: #999; font-size: 15px; line-height: 1.7; font-style: italic;">
                Here is what emerged from the depths this month.
              </p>
            </td>
          </tr>
          
          <!-- Stats -->
          <tr>
            <td style="padding: 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="text-align: center; padding: 15px;">
                    <div style="color: #0f766e; font-size: 28px; font-weight: bold;">${reportData.stats.totalSessions}</div>
                    <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Sessions</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 15px;">
                    <div style="color: #0f766e; font-size: 28px; font-weight: bold;">${reportData.stats.avgDepth}</div>
                    <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Avg Depth</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 15px;">
                    <div style="color: #0f766e; font-size: 28px; font-weight: bold;">${reportData.stats.maxDepth}</div>
                    <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Max Depth</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 15px;">
                    <div style="color: #5dade2; font-size: 12px; font-weight: bold;">${escapeHtml(reportData.stats.deepestTheme || 'Self')}</div>
                    <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Deepest Theme</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Narrative -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #0a0a0a; border-left: 3px solid #0f766e; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #bbb; font-size: 15px; line-height: 1.8; font-style: italic;">
                  ${escapeHtml(reportData.narrative)}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Question of the Month -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em;">Question of the Month</p>
              <p style="margin: 0; color: #0f766e; font-size: 18px; line-height: 1.6; font-style: italic;">
                "${escapeHtml(reportData.questionOfTheMonth)}"
              </p>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <a href="https://sorca.life" style="display: inline-block; padding: 14px 32px; background-color: transparent; border: 1px solid #0f766e; color: #0f766e; text-decoration: none; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px;">
                Continue Your Journey
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #222;">
              <p style="margin: 0; color: #444; font-size: 11px;">
                You're receiving this because you're a Philosopher tier member.
              </p>
              <p style="margin: 10px 0 0; color: #333; font-size: 10px;">
                <a href="https://sorca.life/settings" style="color: #666; text-decoration: underline;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
SORCA - Monthly Excavation Report
${reportMonth}

Dear ${userName},

Here is what emerged from the depths this month.

STATS
- Sessions: ${reportData.stats.totalSessions}
- Average Depth: ${reportData.stats.avgDepth}
- Maximum Depth: ${reportData.stats.maxDepth}
- Deepest Theme: ${reportData.stats.deepestTheme || 'Self'}

NARRATIVE
${reportData.narrative}

QUESTION OF THE MONTH
"${reportData.questionOfTheMonth}"

Continue your journey at https://sorca.life

---
You're receiving this because you're a Philosopher tier member.
Manage preferences: https://sorca.life/settings
  `;

  return sendEmail({
    to,
    subject: `Your Excavation Report — ${reportMonth}`,
    html,
    text,
  });
}

/**
 * Send therapist pattern alert email
 */
export async function sendPatternAlertEmail(
  to: string,
  therapistName: string,
  clientName: string,
  alertData: {
    type: string;
    message: string;
    severity: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const severityColor = alertData.severity === 'high' ? '#e74c3c' : alertData.severity === 'medium' ? '#f39c12' : '#27ae60';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sorca Pattern Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #111; border: 1px solid #222; border-radius: 8px;">
          <tr>
            <td style="padding: 30px; border-bottom: 1px solid #222;">
              <h1 style="margin: 0; color: #0f766e; font-size: 18px; letter-spacing: 0.15em;">SORCA</h1>
              <p style="margin: 5px 0 0; color: #666; font-size: 11px; text-transform: uppercase;">Pattern Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 15px; color: #ccc; font-size: 14px;">
                Dear ${escapeHtml(therapistName)},
              </p>
              <p style="margin: 0 0 20px; color: #999; font-size: 13px; line-height: 1.6;">
                A pattern has been detected for your client <strong style="color: #ccc;">${escapeHtml(clientName)}</strong>:
              </p>
              <div style="background-color: #0a0a0a; border-left: 3px solid ${severityColor}; padding: 15px; border-radius: 4px;">
                <p style="margin: 0 0 5px; color: #666; font-size: 10px; text-transform: uppercase;">${escapeHtml(alertData.type)} · ${escapeHtml(alertData.severity)} severity</p>
                <p style="margin: 0; color: #bbb; font-size: 14px; line-height: 1.6;">
                  ${escapeHtml(alertData.message)}
                </p>
              </div>
              <p style="margin: 20px 0 0; text-align: center;">
                <a href="https://sorca.life/dashboard" style="display: inline-block; padding: 12px 24px; background-color: transparent; border: 1px solid #0f766e; color: #0f766e; text-decoration: none; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 4px;">
                  View Dashboard
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[Sorca] Pattern Alert: ${clientName.replace(/[<>"]/g, '')}`,
    html,
  });
}
