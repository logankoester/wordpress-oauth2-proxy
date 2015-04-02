# Wordpress OAuth2 Proxy

A reverse proxy using [WP OAuth Server](https://wordpress.org/plugins/oauth2-provider/) as an authentication scheme.

You can use it to expose any internal service to your [Wordpress](https://wordpress.org/) users.

## Usage

### Install the Wordpress plugin

First, you need to install [WP OAuth
Server](https://wordpress.org/plugins/oauth2-provider/) on your Wordpress site.

In [WP-CLI](http://wp-cli.org/)...
```bash
$ wp plugin install --activate oauth2-provider
```

### Create a new client

From your
`https://YOUR_WORDPRESS/wp-admin/options-general.php?page=wo_settings#clients`
page, click "Add New Client", and set the redirect URI to
`https://YOUR_SERVICE/auth/wordpress/callback`, where `YOUR_SERVICE` is the
public name of your `wordpress-oauth2-proxy`.

Copy the **Client ID** and **Secret** for the client from this page.

### Configure the proxy

It is easiest to use [Docker](https://www.docker.com/) with [Docker
Compose](https://docs.docker.com/compose/), but if you prefer you can simply
set the appropriate environment variables and run `node index.js`.

> If you are not using Docker, you will need to install [node](nodejs.org) and
[MongoDB](https://www.mongodb.org/) (or get a hosted MongoDB database from
[Compose](https://www.compose.io/)). The database is merely used to persist
authenticated clients.

Copy `docker-compose.example.yml` into your project, and adjust the environment
variables as appropriate, then run `docker-compose up`.

Variable            | Explanation
--------------------|------------
HOST                | The external hostname for your service
TARGET              | The internal hostname of the service to expose through the authenticated proxy. Commonly a linked image.
TARGET_SCHEME       | "http" or "https"
HTTP_PORT           | Default: 80
HTTPS_PORT          | Default: 443
HTTPS_FORCE         | Enable to redirect all non-https requests
KEY_FILE            | Path to a TLS certificate key
CERT_FILE           | Path to a TLS certificate
DB_URI              | A MongoDB database (by default running in a linked container)
SESSION_SECRET      | Change this to any random string
OAUTH_CLIENT_ID     | The **Client ID** you created in Wordpress.
OAUTH_CLIENT_SECRET | The **Secret** you created in Wordpress.
OAUTH_URL           | The `SITEURL` of the Wordpress instance.
OAUTH_CALLBACK_URL  | Prefix with the external URI of your service (such as a CNAME pointing to this Docker host). The `/auth/wordpress/callback` route is handled by `wordpress-oauth2-proxy`.

> Make sure that TARGET is not publicly accessible, or
> unauthenticated users can simply ignore your reverse proxy!

With the proxy up and running, ppen the site in your browser, and verify the login process.

You're done!

## Hacking

You will need `docker` and `docker-compose` installed.

```bash
$ git clone git@github.com:logankoester/wordpress-oauth2-proxy.git
$ cd wordpress-oauth2-proxy
$ mv docker-compose.example.yml docker-compose.yml

# Modify docker-compose.yml for your environment...

$ docker-compose up
```

## Author

Copyright (c) 2015 [Logan Koester](http://logankoester.com). Released under the MIT license. See `LICENSE` for details.
