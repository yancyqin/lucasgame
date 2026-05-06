import http.server, os
port = int(os.environ.get('PORT', 8765))
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port, bind='')
