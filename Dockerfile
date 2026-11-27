# The site as a container, for the release pipeline (.github/workflows/release.yml). The site itself is
# static: these are the same files GitHub Pages serves. COMMIT is written to /version at build time.
FROM nginx:1.29-alpine
ARG COMMIT=unknown
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js calc.js styles.css /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
RUN printf '%s\n' "$COMMIT" > /usr/share/nginx/html/version
