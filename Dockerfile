# The site as a container, for the release pipeline (.github/workflows/release.yml). The site itself is
# static: these are the same files GitHub Pages serves. COMMIT is written to /version at build time.
FROM nginx:1.29-alpine
ARG COMMIT=unknown
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js calc.js styles.css /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
RUN printf '%s\n' "$COMMIT" > /usr/share/nginx/html/version
# The trial of the pipeline's settings: two build settings fixed into the image, then a plain setting and a
# secret read when the container starts. /settings shows them, the secret by its length only.
ARG TRIAL_BUILD=none
ARG SITE_ADDRESS=none
RUN printf 'build=%s\naddress=%s\n' "$TRIAL_BUILD" "$SITE_ADDRESS" > /usr/share/nginx/html/settings.build
COPY deploy/settings.sh /docker-entrypoint.d/40-settings.sh
RUN chmod +x /docker-entrypoint.d/40-settings.sh
