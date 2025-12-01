import nodemailer from 'nodemailer';

/**
 * Sends a summary email to the manager.
 * 
 * @param {Object} credentials - IMAP/SMTP credentials { user, pass, host }
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 */
export async function sendSummaryEmail(credentials, toEmail, subject, htmlContent) {
    try {
        const transporter = nodemailer.createTransport({
            host: credentials.host || 'smtp.gmail.com', // Default to Gmail SMTP if host is imap.gmail.com or not provided
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: credentials.user,
                pass: credentials.pass,
            },
        });

        const info = await transporter.sendMail({
            from: `"Recruiter Agent" <${credentials.user}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
