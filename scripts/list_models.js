const https = require('https');

https.get('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAcC03YAoDUBCauLpeBLIgt9wbwpbTgvl4', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const data = JSON.parse(body);
        const models = data.models.map(m => m.name).filter(n => n.includes('gemini'));
        console.log(models.join('\n'));
    });
});
