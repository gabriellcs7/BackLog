"""Prévia local do BackLog: pasta fixa e código sempre atualizado."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent


class BacklogHandler(SimpleHTTPRequestHandler):
    def refresh_asset(self):
        path = urlsplit(self.path).path
        return path.endswith('/') or Path(path).suffix.lower() in {'.html', '.css', '.js', '.json'}

    def send_head(self):
        # Evita 304 de uma versão antiga e mantém a prévia dentro do projeto.
        try:
            target = Path(self.translate_path(self.path)).resolve()
            relative = target.relative_to(ROOT)
        except (ValueError, OSError):
            self.send_error(404, 'Not found')
            return None
        if any(part.startswith('.') for part in relative.parts):
            self.send_error(404, 'Not found')
            return None
        if self.refresh_asset():
            for name in ('If-Modified-Since', 'If-None-Match'):
                if name in self.headers:
                    del self.headers[name]
        return super().send_head()

    def end_headers(self):
        if self.refresh_asset():
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404, 'Not found')
        return None


def main():
    parser = ArgumentParser(description='Abra o BackLog localmente, sem cache de código.')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('Use uma porta entre 0 e 65535.')
    handler = partial(BacklogHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as error:
        parser.exit(1, f'Não foi possível abrir a porta {args.port}. Se outro servidor estiver aberto, pare-o com Ctrl+C e tente novamente.\nDetalhe: {error}\n')
    port = server.server_address[1]
    print(f'BackLog: http://localhost:{port}', flush=True)
    print(f'Perfil: http://localhost:{port}/view/profile.html', flush=True)
    print('Mantenha este terminal aberto. Atualize a página para ver as alterações; Ctrl+C para encerrar.', flush=True)
    with server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nServidor encerrado.', flush=True)


if __name__ == '__main__':
    main()
