# ubuntu & node
FROM node:12.6.0-stretch

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apt-get -qqy update && \
    # Install chrome
    apt-get install -y wget && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && apt-get -y install google-chrome-stable && \
    # Install opencv dependencies
    apt-get install -y libsm6 libxext6 libxrender-dev \
    # Install ffmpeg, nano, java, xvfb
    ffmpeg \
    nano \
    netcat \
    openjdk-8-jre-headless \
    xvfb \
    xfonts-100dpi \
    xfonts-75dpi \
    xfonts-scalable \
    xfonts-cyrillic && \
    # Free up space
    apt-get clean

# disable "Chrome is being controlled by automated test software"
# https://github.com/jitsi/jibri/issues/208#issuecomment-518285349
# https://www.chromium.org/administrators/linux-quick-start
RUN mkdir -p /etc/opt/chrome/policies/managed && echo "{ \"CommandLineFlagSecurityWarningsEnabled\": false }" > /etc/opt/chrome/policies/managed/managed_policies.json

# Copy everything and install dependencies in a static location that is not WORKDIR
# WORKDIR will be replaced by github action volume
ENV QAWOLF_DIR "/root/qawolf"

# Copy and build qawolf
COPY . ${QAWOLF_DIR}/.

# uncomment to see what is copied
# RUN find ${QAWOLF_DIR}

RUN cd ${QAWOLF_DIR} && npm run bootstrap

# Set default env variables
ENV QAW_CHROME_EXECUTABLE_PATH="google-chrome-stable" \
    QAW_CHROME_OFFSET_Y=72 \
    QAW_DOCKER="true" \
    # for recording
    QAW_DISPLAY_HEIGHT=1080 \
    QAW_DISPLAY_WIDTH=1920 \ 
    QAW_HEADLESS="false" \
    QAW_SERIAL="true"

ENTRYPOINT ["/root/qawolf/entrypoint.sh"]
