"""Official RSS sources for the local BackLog server; standard library only."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
import ipaddress
import re
import threading
import time
from urllib.parse import urlsplit, urlunsplit, urljoin, parse_qsl, urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

SOURCES = (
    {"name": "PlayStation.Blog", "url": "https://blog.playstation.com/feed/", "hosts": ("blog.playstation.com",), "category": "PlayStation"},
    {"name": "Xbox Wire", "url": "https://news.xbox.com/en-us/feed/", "hosts": ("news.xbox.com",), "category": "Xbox"},
    {"name": "Steam News", "url": "https://store.steampowered.com/feeds/news.xml", "hosts": ("store.steampowered.com", "steamcommunity.com"), "category": "PC gaming"},
)
CACHE_SECONDS = 600
RETRY_SECONDS = 60
MAX_BYTES = 2_000_000


def safe_url(value, hosts=None):
    try:
        url = urlsplit(str(value).strip())
        host = (url.hostname or "").lower()
        if url.scheme != "https" or not host or url.username or url.password or url.port not in (None, 443):
            return None
        if hosts is not None and host not in hosts:
            return None
        if host == "localhost" or host.endswith((".local", ".internal")):
            return None
        try:
            ipaddress.ip_address(host)
            return None
        except ValueError:
            pass
        query = urlencode([(k, v) for k, v in parse_qsl(url.query) if not k.lower().startswith("utm_") and k.lower() not in ("fbclid", "gclid")])
        return urlunsplit(("https", url.netloc, url.path, query, ""))
    except (ValueError, TypeError):
        return None


class FeedHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text = []
        self.image = None

    def handle_data(self, data):
        self.text.append(data)

    def handle_starttag(self, tag, attributes):
        if tag != "img" or self.image:
            return
        attrs = dict(attributes)
        for dimension, minimum in (("width", 160), ("height", 80)):
            value = attrs.get(dimension, "")
            if value.isdigit() and int(value) < minimum:
                return
        image = safe_url(attrs.get("src", ""))
        if image and not urlsplit(image).path.lower().endswith(".gif"):
            self.image = image


def clean_title(value):
    parser = FeedHTML()
    parser.feed(unescape(value or ""))
    return re.sub(r"\s+", " ", "".join(parser.text)).strip()[:300]


def local_name(tag):
    return tag.rsplit("}", 1)[-1]


def publication_date(value):
    if not value:
        return None
    try:
        result = parsedate_to_datetime(value)
    except (ValueError, TypeError, IndexError):
        try:
            result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    if result.tzinfo is None:
        result = result.replace(tzinfo=timezone.utc)
    return result.astimezone(timezone.utc)


def parse_feed(data, source, now=None):
    if len(data) > MAX_BYTES or re.search(br"<!\s*(DOCTYPE|ENTITY)\b", data, re.I):
        raise ValueError("Unsupported feed document")
    try:
        root = ET.fromstring(data)
    except ET.ParseError as error:
        raise ValueError("Invalid feed document") from error
    now = now or datetime.now(timezone.utc)
    stories = []
    for item in (node for node in root.iter() if local_name(node.tag) == "item"):
        fields = {}
        for child in item:
            fields.setdefault(local_name(child.tag), child.text or "")
        title = clean_title(fields.get("title"))
        link = safe_url(urljoin(source["url"], fields.get("link", "")), source["hosts"])
        published = publication_date(fields.get("pubDate") or fields.get("date"))
        if not title or not link or not published or published > now + timedelta(minutes=5):
            continue
        image = None
        for child in item.iter():
            if local_name(child.tag) in ("thumbnail", "content", "enclosure"):
                candidate = safe_url(child.attrib.get("url", ""))
                if candidate and not child.attrib.get("type", "").startswith(("video/", "audio/")):
                    image = candidate
                    break
        if not image:
            parser = FeedHTML()
            parser.feed(fields.get("encoded") or fields.get("description") or "")
            image = parser.image
        stories.append({"title": title, "url": link, "published_at": published.isoformat(), "image": image,
                        "source": source["name"], "category": source["category"]})
        if len(stories) >= 40:
            break
    if not stories:
        raise ValueError("No valid stories in feed")
    return stories


def fetch_feed(url):
    request = Request(url, headers={"User-Agent": "BackLogLocalPreview/1.0", "Accept": "application/rss+xml, application/xml, text/xml"})
    with urlopen(request, timeout=8) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("Feed response too large")
    return data


class ArticleImage(HTMLParser):
    """Reads only public image metadata, never article text or executable HTML."""
    def __init__(self, page_url):
        super().__init__(convert_charrefs=True)
        self.page_url, self.image = page_url, None

    def handle_starttag(self, tag, attributes):
        if tag != 'meta' or self.image:
            return
        attrs = dict(attributes)
        if attrs.get('property', attrs.get('name', '')).lower() in ('og:image', 'twitter:image'):
            self.image = safe_url(urljoin(self.page_url, attrs.get('content', '')))


def fetch_article_image(url):
    allowed = tuple(host for source in SOURCES for host in source['hosts'])
    if not safe_url(url, allowed):
        return None
    try:
        request = Request(url, headers={'User-Agent': 'BackLogLocalPreview/1.0', 'Accept': 'text/html'})
        with urlopen(request, timeout=4) as response:
            if not safe_url(response.geturl(), allowed):
                return None
            document = response.read(800_000).decode('utf-8', errors='replace')
        end = document.lower().find('</head>')
        parser = ArticleImage(url)
        parser.feed(document[:end + 7] if end >= 0 else document)
        return parser.image
    except Exception:
        return None


def select_stories(items, limit=4):
    unique, titles = {}, set()
    for item in sorted(items, key=lambda row: row["published_at"], reverse=True):
        key = item["url"].rstrip("/")
        title = re.sub(r"\W+", "", item["title"].casefold())
        if key not in unique and title not in titles:
            unique[key] = item
            titles.add(title)
    selected, remaining, counts = [], [], {}
    for item in unique.values():
        name = item["source"]
        if counts.get(name, 0) < 2 and len(selected) < limit:
            selected.append(item)
            counts[name] = counts.get(name, 0) + 1
        else:
            remaining.append(item)
    selected.extend(remaining[:max(0, limit - len(selected))])
    return sorted(selected, key=lambda row: row["published_at"], reverse=True)


class NewsService:
    def __init__(self, fetcher=fetch_feed, clock=time.time, image_fetcher=fetch_article_image):
        self.fetcher, self.clock = fetcher, clock
        self.image_fetcher = image_fetcher
        self.lock = threading.Lock()
        self.feeds = {}
        self.payload = None
        self.last_attempt = None
        self.failed = False

    def get(self, force=False):
        with self.lock:
            now = self.clock()
            elapsed = now - self.last_attempt if self.last_attempt is not None else None
            wait = RETRY_SECONDS if force or self.failed else CACHE_SECONDS
            if elapsed is not None and 0 <= elapsed < wait:
                if self.payload:
                    return self.payload
                raise RuntimeError("News sources are temporarily unavailable")
            self.last_attempt = now
            moment = datetime.fromtimestamp(now, timezone.utc)
            def read(source):
                try:
                    return source["name"], parse_feed(self.fetcher(source["url"]), source, moment)
                except Exception:
                    return source["name"], None
            with ThreadPoolExecutor(max_workers=len(SOURCES)) as pool:
                results = list(pool.map(read, SOURCES))
            available = 0
            for name, rows in results:
                if rows:
                    self.feeds[name] = rows
                    available += 1
            if not available:
                self.failed = True
                if self.payload:
                    self.payload = {**self.payload, "stale": True, "partial": True}
                    return self.payload
                raise RuntimeError("News sources are temporarily unavailable")
            self.failed = available < len(SOURCES)
            selected = select_stories([item for rows in self.feeds.values() for item in rows])
            missing = [item for item in selected if not item['image']]
            if missing:
                with ThreadPoolExecutor(max_workers=4) as pool:
                    images = list(pool.map(self.image_fetcher, [item['url'] for item in missing]))
                for item, image in zip(missing, images):
                    if image:
                        item['image'] = image
            self.payload = {"items": selected,
                            "fetched_at": moment.isoformat(), "stale": False, "partial": self.failed,
                            "refresh_after": CACHE_SECONDS}
            return self.payload


news_service = NewsService()
