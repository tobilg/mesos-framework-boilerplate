FROM mhart/alpine-node:6.3.0

MAINTAINER tobilg@gmail.com

# Set application name
ENV APP_NAME mesos-framework-boilerplate

# Set application directory
ENV APP_DIR /usr/local/${APP_NAME}

# Set node env to production, so that npm install doesn't install the devDependencies
ENV NODE_ENV production

# Add application
ADD . ${APP_DIR}

# Change the workdir to the app's directory
WORKDIR ${APP_DIR}

# Setup of the application
RUN apk add --no-cache git && \
    rm -rf ${APP_DIR}/node_modules && \
    rm -rf ${APP_DIR}/public/bower_components && \
    mkdir -p ${APP_DIR}/logs && \
    npm set progress=false && \
    npm install --silent && \
    npm install bower -g && \
    bower install --allow-root

CMD ["npm", "start"]