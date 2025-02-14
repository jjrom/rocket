FROM jjrom/s6-overlay:3.1.6.2-noble-20240827.1
LABEL maintainer="jerome.gasperi@gmail.com"

# Add ppa, curl and syslogd
RUN apt-get update
RUN apt-get install -y \
    software-properties-common \
    curl \
    inetutils-syslogd \
    zip \
    unzip \
    gettext-base \
    nginx && \
    apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV ROCKET_APP_TITLE="rocket" \
    ROCKET_APP_DESCRIPTION="rocket is a STAC viewer" \
    ROCKET_APP_AUTHOR="jerome.gasperi@gmail.com" \
    ROCKET_APP_ICON="favicon.ico" \
    ROCKET_VERSION="10.0.0" \
    BUILD_DIR=./build/rocket

# Copy NGINX service script
COPY ${BUILD_DIR}/start-nginx.sh /etc/services.d/nginx/run
RUN chmod 755 /etc/services.d/nginx/run

# Copy NGINX configuration
COPY ${BUILD_DIR}/container_root/etc/nginx /etc/nginx

# Copy run.d configuration
COPY ${BUILD_DIR}/container_root/cont-init.d /etc/cont-init.d

# Copy compiled app from builder
RUN mkdir /app
COPY ${BUILD_DIR}/dist/app /app
COPY ./themes/rocket-default.css /app/assets/css/rocket-theme.css

