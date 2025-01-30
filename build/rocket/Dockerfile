FROM node:10.1.0-stretch
LABEL maintainer="jerome.gasperi@gmail.com"

ENV BUILD_DIR=./build/rocket

RUN mkdir /dist
COPY ./src ./src
COPY ${BUILD_DIR}/package.json ./package.json
COPY ${BUILD_DIR}/GruntFile.js ./GruntFile.js

RUN npm install --verbose

ARG ROCKET_TARGET
RUN node_modules/grunt/bin/grunt --gruntfile ./GruntFile.js ${ROCKET_TARGET}

FROM jjrom/s6-overlay:3.1.6.2-noble-20240827.1
LABEL maintainer="jerome.gasperi@gmail.com"

ENV BUILD_DIR=./build/rocket

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

# Copy NGINX service script
COPY ${BUILD_DIR}/start-nginx.sh /etc/services.d/nginx/run
RUN chmod 755 /etc/services.d/nginx/run

# Copy NGINX configuration
COPY ${BUILD_DIR}/container_root/etc/nginx /etc/nginx

# Copy run.d configuration
COPY ${BUILD_DIR}/container_root/cont-init.d /etc/cont-init.d

# Copy compiled app from builder
RUN mkdir /app
COPY --from=0 /dist /app
COPY ./themes/rocket-default.css /app/assets/css/rocket-theme.css

