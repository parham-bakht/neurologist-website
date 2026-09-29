# Pediatric Neurologist Website

> The current containerized production guide is [DEPLOYMENT.md](DEPLOYMENT.md). It uses Docker Compose for Nginx, Next.js, FastAPI, and PostgreSQL. The older host-service notes below are retained only as historical/local-development reference.

A Persian pediatric-neurology website and patient-management panel built with:

- **Frontend:** Next.js 15 and React 19
- **Backend:** FastAPI, SQLAlchemy, and Alembic
- **Database:** PostgreSQL 16
- **Production edge:** Nginx and Let's Encrypt HTTPS

This guide deploys the project to a single **Ubuntu 24.04 LTS VPS** using the example domain `example.com`.

> Replace `example.com`, `www.example.com`, `admin@example.com`, `SERVER_IP`, and the repository URL with your real values before using this guide.

## Production architecture

```text
Internet
   |
   | HTTPS :443
   v
Nginx
   |-- / and /api/* except /api/v1/* --> Next.js :3000
   |-- /api/v1/* ---------------------> FastAPI :8000
   `-- /uploads/* --------------------> FastAPI :8000

FastAPI :8000 --> PostgreSQL :55432 --> Docker PostgreSQL :5432
```

Ports `3000`, `8000`, and `55432` listen only on `127.0.0.1`. Only SSH, HTTP, and HTTPS are public.

## Before you begin

You need:

1. An Ubuntu 24.04 LTS VPS with at least 2 GB RAM, 2 CPU cores, and 20 GB disk space.
2. Root access or an existing account with `sudo` access.
3. A Git repository containing this project.
4. A domain whose DNS you can edit.
5. Your VPS public IPv4 address.

The commands below use a dedicated Linux account named `deploy` and install the application at:

```text
/home/deploy/neurologist-website
```

## 1. Point the domain to the VPS

In your DNS provider, create these records:

| Type | Name | Value | Purpose |
| --- | --- | --- | --- |
| `A` | `@` | `SERVER_IP` | `example.com` |
| `A` | `www` | `SERVER_IP` | `www.example.com` |

Do not create an `AAAA` record unless the VPS has working public IPv6.

After saving the records, wait for DNS propagation. From your own computer, verify both names:

```bash
nslookup example.com
nslookup www.example.com
```

Both commands must return the VPS IP before requesting the HTTPS certificate.

## 2. Connect to the server

Run this on your own computer:

```bash
ssh root@SERVER_IP
```

If the VPS provider gives you a user such as `ubuntu`, use:

```bash
ssh ubuntu@SERVER_IP
```

## 3. Create the deployment user

Run these commands on the VPS from the root account or an account with `sudo`:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

`adduser` asks you to choose a password. The name and other profile fields may be left blank.

Keep the current SSH session open. In a second terminal on your computer, confirm that the new account works:

```bash
ssh deploy@SERVER_IP
```

Continue the rest of the guide in the new `deploy` session.

## 4. Update Ubuntu and install base packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx ufw python3 python3-venv python3-pip build-essential libpq-dev openssl snapd
```

Enable Nginx now:

```bash
sudo systemctl enable --now nginx
sudo systemctl status nginx --no-pager
```

The status must show `active (running)`.

## 5. Configure the firewall

Allow SSH before enabling the firewall so the active connection is not locked out:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status verbose
```

The output should allow OpenSSH plus ports 80 and 443 through the Nginx profile.

If your VPS provider also has a cloud firewall, allow inbound TCP ports `22`, `80`, and `443` there as well.

## 6. Install Docker Engine and Docker Compose

Add Docker's official Ubuntu repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

Install and start Docker:

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

The test must print `Hello from Docker!`.

## 7. Install Node.js 22 with nvm

This project requires Node.js 18.18 or newer. Node.js 22 is used here.

Install `nvm` as the `deploy` user:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm alias default 22
nvm use 22
node --version
npm --version
```

`node --version` must begin with `v22.`.

## 8. Clone the project

Set the repository URL. Replace the sample URL with the real Git URL:

```bash
export REPOSITORY_URL='https://github.com/your-account/neurologist-website.git'
export APP_DIR='/home/deploy/neurologist-website'
git clone "$REPOSITORY_URL" "$APP_DIR"
cd "$APP_DIR"
```

Confirm that the expected files exist:

```bash
test -f backend/requirements.txt && echo 'backend found'
test -f frontend/package.json && echo 'frontend found'
test -f docker-compose.production.yml && echo 'production compose file found'
```

For a private repository, configure an SSH deploy key with your Git provider, then use the SSH repository URL instead.

## 9. Create production secrets and environment files

Generate a database password and JWT signing secret. The commands write them directly into ignored `.env` files:

```bash
cd /home/deploy/neurologist-website
umask 077
DB_PASSWORD="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -hex 32)"
```

Create the PostgreSQL environment file used by Docker Compose:

```bash
cat > .env <<EOF
POSTGRES_DB=neurologist
POSTGRES_USER=neurologist
POSTGRES_PASSWORD=${DB_PASSWORD}
EOF
```

Create the backend environment file:

```bash
cat > backend/.env <<EOF
DATABASE_URL=postgresql+asyncpg://neurologist:${DB_PASSWORD}@127.0.0.1:55432/neurologist
JWT_SECRET=${JWT_SECRET}
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS='["https://example.com","https://www.example.com"]'
MAIN_MANAGER_EMAIL=admin@example.com
MAIN_MANAGER_PASSWORD=replace-with-a-strong-random-password
MAIN_MANAGER_NAME='دکتر مهرداد بختیاری'
EOF
```

Create the frontend environment file:

```bash
cat > frontend/.env.local <<'EOF'
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BACKEND_URL=https://example.com
NEXT_PUBLIC_SITE_URL=https://example.com
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
EOF
```

Lock down the files and remove the secrets from the current shell:

```bash
chmod 600 .env backend/.env frontend/.env.local
unset DB_PASSWORD JWT_SECRET
```

Never commit these three files. Confirm Git ignores them:

```bash
git check-ignore .env backend/.env frontend/.env.local
```

The command should print all three paths.

## 10. Start PostgreSQL

The production Compose file binds PostgreSQL only to the server's loopback interface:

```bash
cd /home/deploy/neurologist-website
sudo docker compose --env-file .env -f docker-compose.production.yml up -d postgres
sudo docker compose --env-file .env -f docker-compose.production.yml ps
```

Wait up to 60 seconds for the container to become healthy:

```bash
POSTGRES_CONTAINER="$(sudo docker compose --env-file .env -f docker-compose.production.yml ps -q postgres)"
for attempt in $(seq 1 30); do
    [ "$(sudo docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER")" = 'healthy' ] && break
    sleep 2
done
if [ "$(sudo docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER")" != 'healthy' ]; then
    sudo docker compose --env-file .env -f docker-compose.production.yml logs postgres
    exit 1
fi
unset POSTGRES_CONTAINER
echo 'PostgreSQL is healthy'
```

## 11. Install and migrate the backend

```bash
cd /home/deploy/neurologist-website/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m alembic upgrade head
deactivate
```

The migration command must finish without an exception.

## 12. Build the frontend

Load `nvm`, install the exact locked dependencies, and create the production build:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
cd /home/deploy/neurologist-website/frontend
npm ci
npm run build
```

The build must finish successfully and create `frontend/.next-build`.

## 13. Create the frontend start script

Systemd does not load `nvm` automatically, so create a small start script:

```bash
mkdir -p /home/deploy/.local/bin
cat > /home/deploy/.local/bin/start-neurologist-frontend <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="/home/deploy/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd /home/deploy/neurologist-website/frontend
exec npm run start -- --hostname 127.0.0.1 --port 3000
EOF
chmod 750 /home/deploy/.local/bin/start-neurologist-frontend
```

## 14. Create the backend systemd service

```bash
sudo tee /etc/systemd/system/neurologist-backend.service > /dev/null <<'EOF'
[Unit]
Description=Pediatric Neurologist FastAPI backend
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/neurologist-website/backend
EnvironmentFile=/home/deploy/neurologist-website/backend/.env
ExecStart=/home/deploy/neurologist-website/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

## 15. Create the frontend systemd service

```bash
sudo tee /etc/systemd/system/neurologist-frontend.service > /dev/null <<'EOF'
[Unit]
Description=Pediatric Neurologist Next.js frontend
Wants=network-online.target
After=network-online.target neurologist-backend.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/neurologist-website/frontend
Environment=NODE_ENV=production
Environment=HOME=/home/deploy
EnvironmentFile=/home/deploy/neurologist-website/frontend/.env.local
ExecStart=/home/deploy/.local/bin/start-neurologist-frontend
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

Load, enable, and start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now neurologist-backend
sudo systemctl enable --now neurologist-frontend
sudo systemctl status neurologist-backend --no-pager
sudo systemctl status neurologist-frontend --no-pager
```

Both statuses must show `active (running)`.

Test both applications locally on the VPS:

```bash
curl --fail --silent --show-error http://127.0.0.1:8000/health
curl --head http://127.0.0.1:3000
```

The backend response should be `{"status":"ok"}`, and the frontend should return an HTTP response.

## 16. Configure Nginx

Create the reverse-proxy configuration:

```bash
sudo tee /etc/nginx/sites-available/neurologist-website > /dev/null <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    client_max_body_size 110M;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
EOF
```

Enable the site and disable the default Nginx page:

```bash
sudo ln -sfn /etc/nginx/sites-available/neurologist-website /etc/nginx/sites-enabled/neurologist-website
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` must report that the syntax is valid.

Verify plain HTTP before requesting a certificate:

```bash
curl --head http://example.com
curl --head http://www.example.com
```

## 17. Enable HTTPS with Let's Encrypt

Install the official Certbot snap:

```bash
sudo apt remove -y certbot
sudo snap install --classic certbot
sudo ln -sfn /snap/bin/certbot /usr/local/bin/certbot
```

Request the certificate and enable automatic HTTP-to-HTTPS redirection. Replace the email address with a real monitored address:

```bash
sudo certbot --nginx -d example.com -d www.example.com --redirect --email admin@example.com --agree-tos --no-eff-email
```

Test automatic renewal:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

Verify the live site:

```bash
curl --head https://example.com
curl --head https://www.example.com
```

Open `https://example.com` in a browser and test the home page, login, appointment form, dashboard, and an uploaded article image.

## 18. Sign in as the main manager

When the backend starts, it checks for the email configured in `MAIN_MANAGER_EMAIL`. If that email does not exist, it creates the account once with the configured name and password, assigns the `admin` role, and marks it as the protected main manager. It never overwrites the password or role of an existing account.

With the environment values from step 9, sign in with `admin@example.com` and the value of `MAIN_MANAGER_PASSWORD` at:

```text
https://example.com/login
```

Open **کاربران و نقش‌ها** in the dashboard to create accounts and assign the بیمار, پزشک, or مدیر role. The main manager cannot be demoted through this page or the API.

The related API endpoints are:

```text
GET   /api/v1/admin/users
POST  /api/v1/admin/users
PATCH /api/v1/admin/users/{user_id}/role
```

## 19. Article publishing

Sign in as an administrator or doctor, open `https://example.com/dashboard/articles`, and choose **مقاله جدید**. The editor stores the body as structured Tiptap JSON and supports headings, lists, links, quotes, code, alignment, images, captions, and YouTube embeds.

The editor autosaves after a short pause. **ذخیره پیش‌نویس** keeps an article private. **انتشار** asks for confirmation before the article becomes public. The publication panel supports a future date and time; the backend stores the value as a timezone-aware UTC timestamp. The API process runs a small publication worker every 30 seconds, while public article requests also promote any due records as a safety net.

Uploaded article images and videos are stored under `backend/uploads/articles`. Include that directory in backups. Images support JPEG, PNG, and WebP up to 10 MB. Videos support MP4 and WebM up to 100 MB. The backend verifies the actual file signature and generates a random storage key; images are also stripped of metadata and resized when necessary.

The main article endpoints are:

```text
GET    /api/v1/articles
GET    /api/v1/articles/manage
GET    /api/v1/articles/manage/{article_id}
POST   /api/v1/articles
PATCH  /api/v1/articles/{article_id}
POST   /api/v1/articles/{article_id}/publish
POST   /api/v1/articles/{article_id}/unpublish
POST   /api/v1/articles/{article_id}/schedule
DELETE /api/v1/articles/{article_id}
POST   /api/v1/uploads/images
POST   /api/v1/uploads/videos
```

## 20. Final verification checklist

Run these commands on the VPS:

```bash
sudo docker compose --env-file /home/deploy/neurologist-website/.env -f /home/deploy/neurologist-website/docker-compose.production.yml ps
sudo systemctl is-active neurologist-backend
sudo systemctl is-active neurologist-frontend
sudo systemctl is-active nginx
curl --fail --silent --show-error http://127.0.0.1:8000/health
curl --fail --silent --show-error --output /dev/null https://example.com
sudo ss -lntp
```

Expected results:

- PostgreSQL is `healthy`.
- Both application services and Nginx are `active`.
- Both `curl --fail` commands exit successfully.
- Public listeners are on ports 22, 80, and 443.
- Ports 3000, 8000, and 55432 are bound to `127.0.0.1`, not `0.0.0.0`.

## 21. Make the site discoverable in search engines

The frontend generates page-specific titles and descriptions, canonical URLs, Open Graph and Twitter metadata, structured data, `robots.txt`, and a dynamic XML sitemap. Published articles are included in the sitemap automatically. Login, registration, dashboard, health, and API routes are excluded from indexing.

Before building for production, make sure `frontend/.env.local` contains the exact public HTTPS origin. Do not include a trailing slash:

```bash
NEXT_PUBLIC_SITE_URL=https://example.com
```

Choose one permanent canonical hostname. This guide uses `https://example.com`; requests to `www.example.com` are redirected to it. Rebuild and restart the frontend whenever this variable changes:

```bash
cd /home/deploy/neurologist-website/frontend
npm run build
sudo systemctl restart neurologist-frontend
```

Verify the public SEO endpoints after deployment:

```bash
curl --fail https://example.com/robots.txt
curl --fail https://example.com/sitemap.xml
curl --head https://example.com/
curl --head https://example.com/articles
```

Run the automated crawler-facing audit after at least one article has been published:

```bash
cd /home/deploy/neurologist-website/frontend
SEO_AUDIT_BASE_URL=https://example.com npm run seo:audit
```

The audit checks response codes, canonical URLs, titles and descriptions, structured data, private-page `noindex` rules, the sitemap, the manifest, social image assets, and the absence of remote font or icon dependencies in public HTML.

The sitemap must contain absolute `https://example.com/...` URLs. Open a published article and confirm that its public URL returns `200`. A nonexistent article URL must return `404`.

### Register with Google Search Console

1. Open `https://search.google.com/search-console` and add `example.com` as a **Domain property**.
2. Copy the TXT verification record Google provides into the DNS zone for `example.com`.
3. Wait for DNS propagation and select **Verify** in Search Console.
4. Open **Sitemaps**, enter `sitemap.xml`, and submit it.
5. Use **URL inspection** for `https://example.com/`, `https://example.com/articles`, and one published article. Run the live test and request indexing.
6. Monitor **Pages**, **Core Web Vitals**, and structured-data enhancement reports. Fix server errors, accidental exclusions, or invalid structured data when reported.

Google verification can also use the HTML-tag method. Put only the token value in `GOOGLE_SITE_VERIFICATION` inside `frontend/.env.local`, then rebuild and restart the frontend.

### Register with Bing Webmaster Tools

1. Open `https://www.bing.com/webmasters` and add `https://example.com`.
2. Import the verified property from Google Search Console, or complete Bing's DNS verification.
3. Open **Sitemaps** and submit `https://example.com/sitemap.xml`.
4. Use **URL Inspection** for the homepage, article index, and a published article.
5. Review **Site Scan** and **Search Performance** after Bing has crawled the site.

For Bing's HTML-tag verification method, put the token in `BING_SITE_VERIFICATION` inside `frontend/.env.local`, then rebuild and restart the frontend.

Search engines decide when and whether to index or rank a page. Correct metadata and sitemap submission make discovery and crawling easier, but they do not guarantee a position in search results.

## Deploying future updates

Run these commands each time new code is pushed. First create a backup as shown in the next section.

```bash
ssh deploy@SERVER_IP
cd /home/deploy/neurologist-website
git pull --ff-only
```

Update the backend and apply database migrations:

```bash
cd /home/deploy/neurologist-website/backend
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m alembic upgrade head
deactivate
```

Rebuild the frontend:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
cd /home/deploy/neurologist-website/frontend
npm ci
npm run build
```

Restart and verify:

```bash
sudo systemctl restart neurologist-backend neurologist-frontend
sudo nginx -t
sudo systemctl reload nginx
curl --fail --silent --show-error http://127.0.0.1:8000/health
curl --fail --silent --show-error --output /dev/null https://example.com
```

If `docker-compose.production.yml` changed, also run:

```bash
cd /home/deploy/neurologist-website
sudo docker compose --env-file .env -f docker-compose.production.yml up -d
```

## Backups

The database and `backend/uploads` directory contain persistent user data. Back up both.

Create a manual backup:

```bash
mkdir -p /home/deploy/backups
cd /home/deploy/neurologist-website
BACKUP_TIME="$(date +%Y-%m-%d_%H-%M-%S)"
sudo docker compose --env-file .env -f docker-compose.production.yml exec -T postgres pg_dump -U neurologist -d neurologist -Fc > "/home/deploy/backups/database_${BACKUP_TIME}.dump"
tar -C backend -czf "/home/deploy/backups/uploads_${BACKUP_TIME}.tar.gz" uploads
unset BACKUP_TIME
ls -lh /home/deploy/backups
```

Copy backups to another server or object-storage provider. A backup stored only on the same VPS will be lost if the VPS disk fails.

To restore a database dump into an empty database:

```bash
cd /home/deploy/neurologist-website
sudo docker compose --env-file .env -f docker-compose.production.yml exec -T postgres pg_restore -U neurologist -d neurologist --clean --if-exists < /home/deploy/backups/database_YYYY-MM-DD_HH-MM-SS.dump
```

To restore uploads:

```bash
cd /home/deploy/neurologist-website/backend
tar -xzf /home/deploy/backups/uploads_YYYY-MM-DD_HH-MM-SS.tar.gz
```

## Logs and troubleshooting

### Application logs

```bash
sudo journalctl -u neurologist-backend -n 200 --no-pager
sudo journalctl -u neurologist-frontend -n 200 --no-pager
sudo journalctl -u neurologist-backend -f
sudo journalctl -u neurologist-frontend -f
```

Press `Ctrl+C` to exit a live log.

### Nginx logs

```bash
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```

### PostgreSQL logs and status

```bash
cd /home/deploy/neurologist-website
sudo docker compose --env-file .env -f docker-compose.production.yml ps
sudo docker compose --env-file .env -f docker-compose.production.yml logs --tail=200 postgres
```

### A service fails to start

```bash
sudo systemctl status neurologist-backend --no-pager -l
sudo systemctl status neurologist-frontend --no-pager -l
sudo systemctl daemon-reload
sudo systemctl restart neurologist-backend neurologist-frontend
```

### Nginx returns `502 Bad Gateway`

Test each internal service:

```bash
curl --fail http://127.0.0.1:8000/health
curl --head http://127.0.0.1:3000
```

Then inspect the corresponding systemd log. A failed internal request means the application service is down; a successful internal request with a public 502 usually points to the Nginx configuration.

### Database authentication fails on an old Docker volume

PostgreSQL uses `POSTGRES_PASSWORD` only when it initializes an empty data directory. Changing `.env` later does not change the password inside an existing database volume. For an existing production database, change the role password inside PostgreSQL and update `backend/.env` to match. Do not delete the volume if it contains data you need.

### Check certificate renewal

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## Local development

For local development on Windows PowerShell:

```powershell
docker compose up -d postgres
Copy-Item backend/.env.example backend/.env
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload
```

Open another PowerShell window:

```powershell
Copy-Item frontend/.env.local.example frontend/.env.local
cd frontend
npm install
npm run dev
```

The local website is at `http://localhost:3000`, and the API documentation is at `http://localhost:8000/docs`.

## Official references

- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [nvm installation instructions](https://github.com/nvm-sh/nvm#install--update-script)
- [Certbot with Nginx](https://certbot.eff.org/instructions?ws=nginx&os=snap)
- [Ubuntu firewall documentation](https://ubuntu.com/server/docs/how-to/security/firewalls/)
- [Nginx proxy module documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
