const testUrl = async (url, body) => {
    console.log(`Testing: ${url}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': 'ae9e466e90bf4dee80d40273bb9e8c9e'
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${res.status}`);
        console.log(`Response:`, await res.text());
        console.log('---');
    } catch(e) {
        console.log('Error:', e.message);
    }
};

(async () => {
    const payloads = [
        'https://gateway.pixazo.ai/flux-1-schnell/v1/getData',
        'https://gateway.pixazo.ai/flux-schnell/v1/flux-schnell-request',
        'https://gateway.pixazo.ai/flux-1-schnell/v1/flux-1-schnell-request',
        'https://gateway.pixazo.ai/flux/v1/flux-schnell-request'
    ];
    for (const url of payloads) {
        await testUrl(url, { prompt: "test", width: 1024, height: 1024 });
    }
})();
