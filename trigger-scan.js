// Using built-in fetch (Node 18+)

async function triggerScan() {
    try {
        const response = await fetch('http://localhost:3001/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailCredentials: { user: 'test', pass: 'test', host: 'imap.gmail.com' },
                emailFilters: { subject: 'job_search' }
            })
        });
        console.log('Status:', response.status);
    } catch (e) {
        console.error('Error:', e);
    }
}

triggerScan();
