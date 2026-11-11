# Kantor Virtual Ozami: halaman + login akun CRM + bot Discord absen. Konteks build = akar repo.
FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY index.html data.json ./
COPY aset ./aset
COPY server ./server
ENV SITE_DIR=/app DATA_DIR=/data PORT=8080 NODE_ENV=production
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/sehat || exit 1
CMD ["node", "server/server.js"]
