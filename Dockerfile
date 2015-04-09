FROM node
EXPOSE 80
EXPOSE 433

ENV HOST example.com
ENV TARGET localhost
ENV TARGET_SCHEME http
ENV HTTP_PORT 80
ENV HTTPS_PORT 443
ENV HTTPS_FORCE false
ENV KEY_FILE server.key
ENV CERT_FILE server.crt
ENV DB_URI mongodb://localhost/auth
ENV SESSION_SECRET changeme
ENV OAUTH_CLIENT_ID changeme
ENV OAUTH_CLIENT_SECRET changeme
ENV OAUTH_URL https://wordpress.example
ENV OAUTH_CALLBACK_URL https://service.example/auth/wordpress/callback

ADD . /usr/src/wordpress-oauth2-proxy
WORKDIR /usr/src/wordpress-oauth2-proxy
RUN npm install
ENTRYPOINT ["node", "index.js"]
