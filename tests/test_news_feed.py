import json
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer
from functools import partial
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.request import urlopen, Request

from news_feed import NewsService, SOURCES, parse_feed, select_stories, safe_url, ArticleImage
import servidor

NOW = datetime(2026, 11, 23, 20, tzinfo=timezone.utc)


def feed(source, title='A new game announcement'):
    link = 'https://' + source['hosts'][0] + '/2026/11/23/new-game/'
    return f'''<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
    <title>{title}</title><link>{link}</link><pubDate>Mon, 23 Nov 2026 12:00:00 +0000</pubDate>
    <content:encoded><![CDATA[<img src="https://images.example.com/story.jpg" width="1200" height="675"><script>ignored()</script>]]></content:encoded>
    </item></channel></rss>'''.encode()


class NewsTests(unittest.TestCase):
    def test_rss_metadata_and_no_article_html(self):
        item = parse_feed(feed(SOURCES[0], 'Game &amp; studio news'), SOURCES[0], NOW)[0]
        self.assertEqual(item['title'], 'Game & studio news')
        self.assertEqual(item['image'], 'https://images.example.com/story.jpg')
        self.assertNotIn('content', item)
        self.assertNotIn('description', item)

    def test_namespaced_steam_feed(self):
        data = b'''<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"><item><title>Steam update</title><link>https://store.steampowered.com/news/123/</link><dc:date>2026-11-23T12:00:00Z</dc:date></item></rdf:RDF>'''
        self.assertEqual(parse_feed(data, SOURCES[2], NOW)[0]['source'], 'Steam News')

    def test_article_image_metadata(self):
        parser = ArticleImage('https://blog.playstation.com/story/')
        parser.feed('<meta property="og:image" content="javascript:alert(1)"><meta property="og:image" content="https://images.example.com/hero.jpg"><script>ignored()</script>')
        self.assertEqual(parser.image, 'https://images.example.com/hero.jpg')

    def test_untrusted_urls_future_dates_and_entities(self):
        for url in ['javascript:alert(1)', 'https://localhost/x', 'https://127.0.0.1/x', 'https://user:secret@example.com/x']:
            self.assertIsNone(safe_url(url))
        self.assertIsNone(safe_url('https://other.example/article', SOURCES[0]['hosts']))
        for bad in [b'<!DOCTYPE rss [<!ENTITY x "boom">]><rss/>', b'<rss><broken>']:
            with self.assertRaises(ValueError):
                parse_feed(bad, SOURCES[0], NOW)
        with self.assertRaises(ValueError):
            parse_feed(feed(SOURCES[0]).replace(b'2026 12:00:00', b'2099 12:00:00'), SOURCES[0], NOW)

    def test_cache_refresh_partial_and_stale(self):
        calls, clock = [], [NOW.timestamp()]
        mode = ['ok']
        def fetch(url):
            calls.append(url)
            source = next(s for s in SOURCES if s['url'] == url)
            if mode[0] == 'offline' or mode[0] == 'partial' and source == SOURCES[0]:
                raise OSError('offline')
            return feed(source, source['name'] + (' latest' if len(calls) > 3 else ' first'))
        service = NewsService(fetch, lambda: clock[0])
        first = service.get()
        self.assertEqual(len(calls), 3)
        clock[0] += 20
        self.assertEqual(service.get(force=True), first)
        self.assertEqual(len(calls), 3)
        clock[0] += 601
        mode[0] = 'partial'
        self.assertTrue(service.get()['partial'])
        self.assertEqual(len(calls), 6)
        saved_time = service.payload['fetched_at']
        clock[0] += 61
        mode[0] = 'offline'
        stale = service.get()
        self.assertTrue(stale['stale'])
        self.assertEqual(stale['fetched_at'], saved_time)
        self.assertTrue(stale['items'])

    def test_deduplication_and_source_balance(self):
        rows = []
        for n, source in enumerate(SOURCES):
            item = parse_feed(feed(source, source['name']), source, NOW)[0]
            rows += [{**item, 'url': item['url'] + str(i), 'title': item['title'] + str(i)} for i in range(4)]
        selected = select_stories(rows + rows)
        self.assertEqual(len(selected), 4)
        self.assertEqual(len({row['url'] for row in selected}), 4)
        self.assertGreater(len({row['source'] for row in selected}), 1)

    def test_local_endpoint_get_and_head(self):
        payload = {'items': [], 'fetched_at': NOW.isoformat()}
        class FakeNews:
            def get(self, force=False):
                return payload
        handler = partial(servidor.BacklogHandler, directory=str(servidor.ROOT))
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with patch.object(servidor, 'news_service', FakeNews()):
                url = 'http://127.0.0.1:' + str(server.server_address[1]) + '/api/gaming-news'
                with urlopen(url) as response:
                    self.assertEqual(response.headers['Cache-Control'], 'no-store')
                    self.assertEqual(json.load(response), payload)
                with urlopen(Request(url, method='HEAD')) as response:
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.read(), b'')
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == '__main__':
    unittest.main()
