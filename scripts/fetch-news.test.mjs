import assert from 'node:assert/strict';
import { parseRss, enrich, detectBand, detectGenre, mergeAi, formatItem } from './fetch-news.mjs';

const now = Date.parse('2026-10-30T12:00:00Z');
const rss = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<item><title><![CDATA[Slayer &amp; Metallica announce joint tour]]></title><link>https://ex.com/a</link>
<pubDate>Thu, 30 Oct 2026 10:00:00 +0000</pubDate><description><![CDATA[<p>Kerry King confirms <b>18 stadiums</b>.</p>]]></description>
<media:content url="https://ex.com/a.jpg" medium="image"/></item>
<item><title>Metallica add Mexico City date</title><link>https://ex.com/b</link><pubDate>Thu, 30 Oct 2026 11:00:00 +0000</pubDate>
<content:encoded><![CDATA[<img src="https://ex.com/b.png"> Sold out fast]]></content:encoded></item>
<item><title>Old news about Death</title><link>https://ex.com/c</link><pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate></item>
<item><title>Slayer &amp; Metallica announce joint tour</title><link>https://ex.com/d</link><pubDate>Thu, 30 Oct 2026 09:00:00 +0000</pubDate></item>
<item><title>Sin fecha</title><link>https://ex.com/e</link></item>
<item><title>Link malo</title><link>javascript:alert(1)</link><pubDate>Thu, 30 Oct 2026 09:00:00 +0000</pubDate></item>
</channel></rss>`;

const parsed = parseRss(rss, 'TEST');
assert.equal(parsed.length, 4, 'descarta items sin fecha o con link no http');
assert.equal(parsed[0].title, 'Slayer & Metallica announce joint tour');
assert.equal(parsed[0].summary, 'Kerry King confirms 18 stadiums .');
assert.equal(parsed[0].image, 'https://ex.com/a.jpg');
assert.equal(parsed[1].image, 'https://ex.com/b.png');

const items = enrich(parsed, now);
assert.equal(items.length, 2, 'quita viejas y duplicadas');
assert.ok(items.every(i => i.viral >= 30 && i.viral <= 99));
assert.equal(detectBand('Mayhem return'), 'Mayhem');
assert.equal(detectBand('Deathcore band signs'), '', 'no confunde Death con deathcore');
assert.equal(detectGenre('new thrash album').genre, 'THRASH');
assert.equal(detectGenre('something else').genre, 'METAL');

mergeAi(items, [{ id: items[0].id, band: 'Slayer', headline: 'Anuncian gira', summary: 'x', captions: { metalero: 'hola', meme: 5 } }, null]);
assert.equal(items[0].band, 'Slayer');
assert.deepEqual(items[0].captions, { metalero: ['hola'] });
assert.equal(items[1].captions, undefined);
const out = formatItem({ ...items[0], img: '' });
assert.match(out.img, /^https:\/\/images\.unsplash\.com/);
console.log('fetch-news: todas las pruebas pasaron');
