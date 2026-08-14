FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV IMAP_HOST=imap.ionos.com
ENV IMAP_PORT=993
ENV IMAP_USE_TLS=true
ENV SMTP_HOST=smtp.ionos.com
ENV SMTP_PORT=587
ENV SMTP_USE_TLS=true

EXPOSE 8931

CMD ["node", "dist/index.js"]
