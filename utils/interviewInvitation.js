/**
 * Interview Invitation Email Template and Sender
 */

/**
 * Generates HTML email template for interview invitation
 * @param {string} candidateName - Name of the candidate
 * @param {string} jobTitle - Job position title
 * @param {string} companyName - Company name
 * @param {string} [interviewTime] - Optional time usage
 * @returns {string} HTML email content
 */
export function generateInterviewEmail(candidateName, jobTitle, companyName, interviewTime) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Interview Invitation</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">${companyName}</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Dear <strong>${candidateName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that after reviewing your application for the <strong>${jobTitle}</strong> position, we would like to invite you to the next stage of our recruitment process.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Your skills and experience stood out to us, and we believe you could be a great fit for our team.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; font-weight: 600;">NEXT STEPS</p>
                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      ${interviewTime
      ? `We have scheduled your interview for: <strong>${interviewTime}</strong>.`
      : 'Our recruitment team will reach out to you shortly to schedule an interview at a time that works best for you.'}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                If you have any questions in the meantime, please don't hesitate to reply to this email.
              </p>
              
              <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                We look forward to speaking with you soon!
              </p>
              
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The ${companyName} Recruitment Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                This is an automated message from the ${companyName} recruitment system.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends interview invitation email to a candidate
 * @param {Object} credentials - SMTP credentials { user, pass, host }
 * @param {Object} candidate - Candidate object with name, email
 * @param {Object} jobCriteria - Job details with jobTitle
 * @param {string} companyName - Company name
 * @param {string} [interviewTime] - Optional interview time
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendInterviewInvitation(credentials, candidate, jobCriteria, companyName, interviewTime) {
  const { sendSummaryEmail } = await import('./emailSender.js');

  try {
    const subject = `Interview Invitation - ${jobCriteria.jobTitle} Position at ${companyName}`;
    const htmlContent = generateInterviewEmail(
      candidate.name,
      jobCriteria.jobTitle,
      companyName,
      interviewTime
    );

    const success = await sendSummaryEmail(
      credentials,
      candidate.email,
      subject,
      htmlContent
    );

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending interview invitation:', error);
    return { success: false, error: error.message };
  }
}
