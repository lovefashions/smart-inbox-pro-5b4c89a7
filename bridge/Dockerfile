FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8931
ENV MCP_AUTH_TOKEN=change-me-in-production
ENV IMAP_HOST=imap.ionos.com
ENV IMAP_PORT=993
ENV IMAP_TLS=true
ENV SMTP_HOST=smtp.ionos.com
ENV SMTP_PORT=587
ENV SMTP_TLS=true

EXPOSE 8931

CMD ["node", "src/index.ts"]
