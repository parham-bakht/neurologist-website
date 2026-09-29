# Production deployment on Ubuntu

This deployment runs four containers on one VPS:

- `nginx`: the only public service, on TCP ports 80 and 443
- `frontend`: Next.js standalone server on internal port 3000
- `backend`: FastAPI/Uvicorn on internal port 8000
- `db`: PostgreSQL 16 on internal port 5432

PostgreSQL data and backend uploads are kept in Docker named volumes. Nginx routes `/` and the frontend-owned `/api/*` routes to Next.js, while `/api/v1/*`, `/uploads/*`, and `/health` go directly to FastAPI.

Replace every placeholder used below: `REPOSITORY_URL`, `example.com`, `www.example.com`, `admin@example.com`, and `SERVER_IP`.

## 1. Install Docker and the Compose plugin

These commands use Docker's official Ubuntu repository:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git ufw
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in so group membership takes effect, then verify:

```bash
docker --version
docker compose version
```

## 2. Clone and configure

```bash
git clone REPOSITORY_URL neurologist-website
cd neurologist-website
cp .env.example .env
chmod 600 .env
nano .env
```

Set every placeholder in `.env`. Generate independent secrets:

```bash
openssl rand -hex 32
openssl rand -base64 36 | tr -d '\n'
```

Important environment rules:

- `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` configure PostgreSQL.
- `DATABASE_URL` is server-only. Keep its credentials synchronized with the PostgreSQL values and keep the hostname `db`, never `localhost`. Use URL-safe database credentials, or percent-encode reserved URL characters in `DATABASE_URL`.
- `JWT_SECRET` and `MAIN_MANAGER_PASSWORD` must be different strong secrets. The backend rejects the shipped placeholders.
- `CORS_ORIGINS` and `ALLOWED_HOSTS` are JSON arrays on one line.
- `PUBLIC_URL` is build-time public frontend configuration. It feeds `NEXT_PUBLIC_*` values embedded in the browser bundle. After changing it, rebuild the frontend image.
- `BACKEND_URL=http://backend:8000` is injected by Compose only at frontend runtime and is never exposed to browsers.
- `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` are optional.

Validate variable interpolation and the Compose model before starting anything:

```bash
docker compose --env-file .env -f docker-compose.production.yml config --quiet
```

## 3. First deployment and migrations

The application deliberately does not run migrations automatically. Start the database, run the migration as a one-off backend container, then start the complete stack:

```bash
docker compose --env-file .env -f docker-compose.production.yml build
docker compose --env-file .env -f docker-compose.production.yml up -d db
docker compose --env-file .env -f docker-compose.production.yml run --rm backend alembic upgrade head
docker compose --env-file .env -f docker-compose.production.yml up -d
docker compose --env-file .env -f docker-compose.production.yml ps
```

For an already-running backend, the equivalent migration command is:

```bash
docker compose --env-file .env -f docker-compose.production.yml exec backend alembic upgrade head
```

Check the public paths over HTTP before enabling TLS:

```bash
curl -I http://SERVER_IP/
curl http://SERVER_IP/health
```

## 4. Firewall and DNS

Open only SSH, HTTP, and HTTPS. Enable UFW only after allowing the SSH service used by the VPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

At the DNS provider, point `A` records for `example.com` and, if used, `www.example.com` to `SERVER_IP`. Do not request certificates until both names resolve to this VPS. The database, backend, and frontend have no published host ports.

## 5. Enable HTTPS with host Certbot

Install Certbot on Ubuntu while the HTTP Nginx container remains running:

```bash
sudo apt update
sudo apt install -y certbot
sudo certbot certonly --webroot \
  --webroot-path "$(pwd)/certbot/www" \
  --domain example.com \
  --domain www.example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email
```

If the site has no `www` DNS record, omit that `--domain` flag and remove `www.example.com` from the Nginx template and environment arrays.

Create the active HTTPS config. Replace the domain in both the `server_name` and certificate paths. The generic HTTP server remains as a safe fallback and for ACME challenges; requests for your configured domain are redirected by the more-specific HTTPS config.

```bash
cp nginx/https.conf.example nginx/conf.d/10-app-https.conf
sed -i 's/example\.com/YOUR_REAL_DOMAIN/g' nginx/conf.d/10-app-https.conf
docker compose --env-file .env -f docker-compose.production.yml exec nginx nginx -t
docker compose --env-file .env -f docker-compose.production.yml restart nginx
curl -I https://YOUR_REAL_DOMAIN/
```

The generated active HTTPS file is intentionally ignored by Git because it is deployment-specific. Test renewal and install a deploy hook that reloads the container after successful renewals:

```bash
sudo certbot renew --dry-run
sudo install -d /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-neurologist-nginx.sh >/dev/null <<EOF
#!/bin/sh
cd "$(pwd)"
docker compose --env-file .env -f docker-compose.production.yml exec -T nginx nginx -s reload
EOF
sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-neurologist-nginx.sh
```

Ubuntu's Certbot timer handles subsequent renewals. Verify it with `systemctl list-timers | grep certbot`.

## 6. Routine operation

Status and logs:

```bash
docker compose --env-file .env -f docker-compose.production.yml ps
docker compose --env-file .env -f docker-compose.production.yml logs -f
docker compose --env-file .env -f docker-compose.production.yml logs -f backend frontend nginx db
```

Restart services without rebuilding:

```bash
docker compose --env-file .env -f docker-compose.production.yml restart
```

Deploy application updates:

```bash
git pull --ff-only
docker compose --env-file .env -f docker-compose.production.yml build --pull
docker compose --env-file .env -f docker-compose.production.yml up -d db
docker compose --env-file .env -f docker-compose.production.yml run --rm backend alembic upgrade head
docker compose --env-file .env -f docker-compose.production.yml up -d --remove-orphans
docker compose --env-file .env -f docker-compose.production.yml ps
```

Stop containers without deleting persistent data:

```bash
docker compose --env-file .env -f docker-compose.production.yml down
```

Never add `--volumes` unless permanent database and upload deletion is intentional.

## 7. PostgreSQL backup and restore

Read only the non-secret database identifiers needed by the interactive backup and restore commands. Do not source the full `.env`; JSON values and spaces use Compose env-file syntax rather than shell syntax.

```bash
POSTGRES_USER="$(sed -n 's/^POSTGRES_USER=//p' .env)"
POSTGRES_DB="$(sed -n 's/^POSTGRES_DB=//p' .env)"
```

Create a consistent compressed logical backup (the directory stays on the host):

```bash
mkdir -p backups
chmod 700 backups
docker compose --env-file .env -f docker-compose.production.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "backups/neurologist-$(date +%F-%H%M%S).dump"
```

To restore into an empty database, stop application traffic, recreate the database, and restore the selected file. This is destructive to the current database:

```bash
docker compose --env-file .env -f docker-compose.production.yml stop nginx frontend backend
docker compose --env-file .env -f docker-compose.production.yml exec -T db \
  dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB"
docker compose --env-file .env -f docker-compose.production.yml exec -T db \
  createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker compose --env-file .env -f docker-compose.production.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backups/SELECTED_BACKUP.dump
docker compose --env-file .env -f docker-compose.production.yml up -d
```

Back up the `uploads_data` volume separately when uploaded images/videos matter:

```bash
docker run --rm -v neurologist-website_uploads_data:/data:ro -v "$(pwd)/backups:/backup" alpine \
  tar -czf /backup/uploads-$(date +%F-%H%M%S).tar.gz -C /data .
```

## 8. Troubleshooting

- **Compose reports a missing variable:** compare `.env` with `.env.example`; placeholders are not accepted by the production backend.
- **Backend repeatedly restarts with a missing table error:** run the one-off `alembic upgrade head` command from the first-deployment section.
- **Database authentication fails:** make `POSTGRES_*` and `DATABASE_URL` agree. Changing `POSTGRES_PASSWORD` does not rewrite a password inside an existing database volume.
- **502 from Nginx:** inspect `docker compose ... ps` and service logs. Confirm `frontend` and `backend` are healthy.
- **400 Invalid host header:** add the real host to the JSON `ALLOWED_HOSTS` array and recreate the backend.
- **CORS failure:** add the exact scheme and host to `CORS_ORIGINS`; do not use Docker hostnames there.
- **Uploaded media disappears:** confirm the `uploads_data` volume exists with `docker volume ls`; do not use `down --volumes`.
- **Certificate request fails:** verify DNS, ports 80/443, UFW, and `curl http://YOUR_DOMAIN/.well-known/acme-challenge/test` routing. Keep the HTTP config active until issuance succeeds.
- **Nginx fails after enabling TLS:** run `docker compose ... run --rm nginx nginx -t`, verify the certificate path under `/etc/letsencrypt/live/`, and confirm `LETSENCRYPT_DIR=/etc/letsencrypt`.
- **Public URL changed:** update `PUBLIC_URL`, CORS, and allowed hosts, then rebuild; restarting alone cannot change embedded `NEXT_PUBLIC_*` values.

Useful diagnostics:

```bash
docker compose --env-file .env -f docker-compose.production.yml config
docker compose --env-file .env -f docker-compose.production.yml ps
docker compose --env-file .env -f docker-compose.production.yml logs --tail=200 backend frontend nginx db
docker compose --env-file .env -f docker-compose.production.yml exec nginx nginx -t
docker compose --env-file .env -f docker-compose.production.yml exec backend alembic current
```

Automatic migrations are intentionally avoided: they can race during multi-instance startup and make application rollback harder. Review migrations, back up the database, and run them explicitly during deployment.
