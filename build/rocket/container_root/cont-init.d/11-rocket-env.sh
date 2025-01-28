#!/command/with-contenv bash

# Uncomment meta "upgrade-insecure-requests" if env variable USE_HTTPS_PROXY is set to true to force all requests to be https 
# (See [CSP: upgrade-insecure-requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests))
if [[ ${ROCKET_USE_HTTPS_PROXY} == "1" ]]
then
  echo "[rocket][ROCKET_USE_HTTPS_PROXY] Uncomment meta upgrade-insecure-requests to true to force all requests to be https"
  sed -i 's/<\!--<meta http-equiv=\"Content-Security-Policy\" content=\"upgrade-insecure-requests\"\>--\>/<meta http-equiv=\"Content-Security-Policy\" content=\"upgrade-insecure-requests\"\>/' /app/index.html
fi

# Replace ROCKET_IMAGE_TAG in index.html
export ROCKET_IMAGE_TAG=$(cat /app/rocket_version)
echo "[rocket] rocket version is ${ROCKET_IMAGE_TAG}"
sed -i "s/ROCKET_IMAGE_TAG/${ROCKET_IMAGE_TAG}/g" /app/index.html

if [[ $ROCKET_ENVJS_BASE64 ]]
then
  echo "[rocket] Overwrite /app/env.js from input ROCKET_ENVJS_BASE64"
  echo $ROCKET_ENVJS_BASE64 | base64 --decode > /app/env.js
fi

# Variable substitution
if [[ -f "/app/app/env.js" ]]
then
  envsubst < /app/app/env.js > /tmp/env.js && mv /tmp/env.js /app/app/env.js
fi
if [[ -f "/app/env.js" ]]
then
  envsubst < /app/env.js > /tmp/env.js && mv /tmp/env.js /app/env.js
fi