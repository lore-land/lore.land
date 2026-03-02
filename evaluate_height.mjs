import puppeteer from 'puppeteer';
(async () => {
    try {
        const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
        const pages = await browser.pages();
        const page = pages.find(p => p.url().includes('localhost:3000'));
        if (!page) { console.log('Page not found'); process.exit(1); }
        
        const heights = await page.evaluate(() => {
            const elHeights = [];
            const walk = (node) => {
                if (node.nodeType === 1 && node.offsetHeight > 5000) {
                    elHeights.push({tag: node.tagName, id: node.id, className: node.className, height: node.offsetHeight});
                }
                for (let child of node.children) {
                    walk(child);
                }
            };
            walk(document.body);
            return elHeights.sort((a,b) => b.height - a.height);
        });
        console.log(JSON.stringify(heights, null, 2));
        await browser.disconnect();
    } catch (e) {
        console.error(e);
    }
})();
