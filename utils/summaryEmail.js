/**
 * Summary Email Template
 */

/**
 * Generates HTML email template for scan summary
 * @param {Object} jobCriteria - Job criteria details
 * @param {Array} candidates - List of candidates found
 * @param {number} scannedCount - Total emails scanned
 * @returns {string} HTML email content
 */
export function generateSummaryEmail(jobCriteria, candidates, scannedCount) {
    const candidateRows = candidates.map(c => {
        let scoreColor = '#ef4444'; // red
        if (c.score >= 80) scoreColor = '#22c55e'; // green
        else if (c.score >= 60) scoreColor = '#eab308'; // yellow

        return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 16px 12px;">
            <div style="font-weight: 600; color: #1e293b;">${c.name}</div>
            <div style="font-size: 12px; color: #64748b;">${c.email}</div>
          </td>
          <td style="padding: 16px 12px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${scoreColor}15; color: ${scoreColor}; font-weight: 600; font-size: 13px; border: 1px solid ${scoreColor}30;">
              ${c.score}%
            </span>
          </td>
          <td style="padding: 16px 12px;">
            <span style="font-size: 13px; color: #475569; text-transform: capitalize;">${c.status}</span>
          </td>
          <td style="padding: 16px 12px; color: #475569; font-size: 13px; line-height: 1.5; max-width: 300px;">
            ${c.summary}
          </td>
        </tr>
      `;
    }).join('');

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
        <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Recruitment Scan Report</h1>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 16px;">${jobCriteria.jobTitle}</p>
            </td>
          </tr>
          
          <!-- Stats Bar -->
          <tr>
            <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-right: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Emails Scanned</p>
                    <p style="margin: 5px 0 0 0; color: #0f172a; font-size: 24px; font-weight: 700;">${scannedCount}</p>
                  </td>
                  <td align="center">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Candidates Found</p>
                    <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 24px; font-weight: 700;">${candidates.length}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px;">
                Here are the results from your latest recruitment agent scan. The candidates below have been identified and scored based on your criteria.
              </p>
              
              <!-- Candidates Table -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Candidate</th>
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Score</th>
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Status</th>
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">AI Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${candidateRows}
                  </tbody>
                </table>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; text-align: center;">
                You can view full details and take action in the Recruiter Dashboard.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Generated automatically by your AI Recruiter Agent
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
