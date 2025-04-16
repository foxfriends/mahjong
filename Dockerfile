FROM node:22.14.0 AS build
WORKDIR /build
COPY ./client/package.json ./client/package-lock.json ./
RUN npm ci
COPY ./client/.postcssrc ./client/vite.config.js ./
COPY ./client/src/ ./src/
COPY ./server/lib/ ./src/lib/
COPY ./server/socket/ ./src/socket/
ENV NODE_ENV=production
RUN npm run build
CMD ["false"]


FROM node:22.14.0 AS release
WORKDIR /app
COPY --from=build /build/dist ./dist
COPY ./server/package.json ./server/package-lock.json ./
ENV NODE_ENV=production
ENV mahjong_dist=./dist 
ENV mahjong_port=3000
EXPOSE $mahjong_port
RUN npm ci
COPY ./server/lib/ ./lib/
COPY ./server/socket/ ./socket/
COPY ./server/game/ ./game/
COPY ./server/index.js ./
CMD ["node", "index.js"]
