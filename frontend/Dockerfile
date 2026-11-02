# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first to take advantage of layer caching
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# CRA bakes REACT_APP_* variables into the bundle at build time
ARG REACT_APP_GC_TOKEN
ENV REACT_APP_GC_TOKEN=$REACT_APP_GC_TOKEN

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
