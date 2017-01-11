FROM node:4

MAINTAINER Jim Brandt, jimb245@gmail.com 

# Create non-root user
RUN useradd -ms /bin/bash scriptremote
WORKDIR /home/scriptremote/install

# Install prerequisites not included in base
RUN npm install -g bower

# Install ScriptRemote
RUN npm install scriptremote --production
RUN mv node_modules/scriptremote .; rm -r node_modules

# Server port
EXPOSE 3000

WORKDIR /home/scriptremote/install/scriptremote
USER scriptremote
CMD npm run production

#
# Running from repository:
#
# Set up MongDB server
# e.g. docker run --name some-mongo -p 27017:27017 -d mongo
#
# wget https://scriptremote.com/dist/docker.env
#
# Set configuration in docker.env
#
# docker run -p 3000:3000 --env-file docker.env -d jimb245/scriptremote
#
