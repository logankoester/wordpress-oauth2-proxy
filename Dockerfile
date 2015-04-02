FROM node
EXPOSE 80

ENV TARGET http://localhost:5000
ENV PORT 80
ENV DB_URI mongodb://localhost/auth
ENV SESSION_SECRET changeme
ENV OAUTH_CLIENT_ID changeme
ENV OAUTH_CLIENT_SECRET changeme
ENV OAUTH_URL https://wordpress.example
ENV OAUTH_CALLBACK_URL https://service.example/auth/wordpress/callback

ADD . /usr/src/wordpress-oauth2-proxy
WORKDIR /usr/src/wordpress-oauth2-proxy
ENTRYPOINT ["node", "index.js"]
