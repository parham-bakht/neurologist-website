# Deployment handoff and simple CI/CD guide

This document explains, at a high level, how the website was deployed and how to add a simple CI/CD deployment with GitHub Actions.

It intentionally does not contain passwords, private keys, database credentials, or JWT secrets.

## 1. What was deployed

The application is deployed on an AlmaLinux 9.8 VPS at:

```text
/opt/neurologist-website
```

The production stack uses Docker Compose and has four containers:

| Container | Purpose | Publicly exposed? |
| --- | --- | --- |
| `nginx` | Receives website traffic and routes requests | Yes, ports 80 and 443 |
| `frontend` | Runs the Next.js website | No, internal Docker network only |
| `backend` | Runs the FastAPI API | No, internal Docker network only |
| `db` | Runs PostgreSQL 16 | No, internal Docker network only |

Persistent Docker volumes keep PostgreSQL data and uploaded media safe when containers are replaced:

```text
neurologist-website_postgres_data
neurologist-website_uploads_data
```

## 2. Server preparation that was completed

The following work was completed on the VPS:

1. Installed Docker Engine, Docker Compose, Git, and Firewalld.
2. Opened only SSH, HTTP, and HTTPS in the server firewall.
3. Added a 2 GB swap file because the VPS has limited RAM and Next.js builds can use significant memory.
4. Installed the project in `/opt/neurologist-website`.
5. Created a production `.env` file with generated database, JWT, and administrator credentials.
6. Built the FastAPI and Next.js production images.
7. Created the PostgreSQL database volume.
8. Ran every Alembic migration through revision `0010`.
9. Started the complete Docker Compose stack.
10. Verified that all four containers are healthy, `/health` returns HTTP 200, and the homepage is publicly reachable.

The backend Docker image uses this Python package mirror because the VPS cannot reliably reach `files.pythonhosted.org`:

```text
https://mirror-pypi.runflare.com/simple
```

SELinux-compatible labels were also added to the Nginx bind mounts because AlmaLinux runs SELinux in enforcing mode.

## 3. Current production status

The website is currently reachable over HTTP at:

```text
http://188.212.96.214
```

The configured domain is:

```text
pedneuro.ir
```

At deployment time, `pedneuro.ir` returned `NXDOMAIN`. This means public DNS did not yet have an active record for the domain. HTTPS cannot be issued until DNS works.

Create these records at the domain's DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `188.212.96.214` |
| `A` | `www` | `188.212.96.214` |

The `www` record is optional, but if it is omitted, `www.pedneuro.ir` should also be removed from the production configuration before requesting a certificate.

After DNS resolves, finish the Let's Encrypt setup described in `DEPLOYMENT.md`.

## 4. Where secrets are stored

The production application secrets are stored in these ignored files:

```text
Local computer:  F:\neurologist-website\.env
Production VPS:  /opt/neurologist-website/.env
```

The SSH connection details are stored locally in:

```text
F:\neurologist-website\backend\.env
```

These files must never be committed to Git or copied into GitHub Actions artifacts.

## 5. What CI/CD means here

For this project, the simple workflow will be:

```text
Push to main
    -> GitHub Actions checks out the committed code
    -> rsync copies it to the VPS without touching the server .env
    -> Docker rebuilds changed images
    -> Alembic applies new database migrations
    -> Docker Compose replaces the running containers
    -> A health check confirms that the API is running
```

Only pushes to the `main` branch will deploy.

## 6. Before creating the workflow

The production-related files in this working folder are currently local changes. Review them, commit them, and push them to GitHub before enabling automatic deployment.

Example:

```powershell
git status
git add .
git commit -m "Add production Docker deployment"
git push origin main
```

Always read `git status` before `git add .` so that you do not accidentally commit a secret or an unrelated file.

## 7. One-time server setup for GitHub Actions

Do not let GitHub Actions log in as `root`. Create a dedicated deployment user instead.

SSH to the VPS as root and run:

```bash
dnf install -y rsync
useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
chown -R deploy:deploy /opt/neurologist-website
```

The `deploy` user can update this application and run Docker, but it does not need the root SSH password.

### Create a deployment SSH key

Run this on your own computer, not on the VPS:

```powershell
ssh-keygen -t ed25519 -C "github-actions-pedneuro" -f "$env:USERPROFILE\.ssh\pedneuro_github_actions"
```

When prompted for a passphrase, leave it empty because GitHub Actions cannot answer an interactive passphrase prompt.

This creates:

```text
pedneuro_github_actions       Private key: store in GitHub Secrets
pedneuro_github_actions.pub   Public key: install on the VPS
```

Never share or upload the private key as a normal repository file.

### Install the public key on the VPS

Display the public key on your computer:

```powershell
Get-Content "$env:USERPROFILE\.ssh\pedneuro_github_actions.pub"
```

Copy that one-line public key. On the VPS, add it to:

```text
/home/deploy/.ssh/authorized_keys
```

Then set safe permissions:

```bash
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Test the key from your computer before continuing:

```powershell
ssh -i "$env:USERPROFILE\.ssh\pedneuro_github_actions" deploy@188.212.96.214
```

After connecting, confirm Docker access:

```bash
docker compose version
```

## 8. Add GitHub repository secrets

In the GitHub repository, open:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Create these secrets:

| Secret | Value |
| --- | --- |
| `SERVER_HOST` | `188.212.96.214` |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | The complete contents of `pedneuro_github_actions` |
| `SERVER_KNOWN_HOSTS` | The verified SSH host-key line described below |

### Create the known-hosts value

On your computer, run:

```powershell
ssh-keyscan -t ed25519 188.212.96.214 | Out-File -Encoding ascii server_known_hosts
ssh-keygen -lf server_known_hosts
```

Before storing it, confirm that the displayed fingerprint is:

```text
SHA256:vWFuo5MGzGDsCLV/1Qqx23TjjLeqy0d50VUzt7tmvfU
```

If it is different, stop and investigate instead of accepting the new key.

After verification, put the complete contents of `server_known_hosts` into the `SERVER_KNOWN_HOSTS` GitHub secret.

## 9. Create the GitHub Actions workflow

Create this file:

```text
.github/workflows/deploy.yml
```

Use the following workflow:

```yaml
name: Deploy production

on:
  push:
    branches: [main]

concurrency:
  group: production-deployment
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Configure SSH
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_KNOWN_HOSTS: ${{ secrets.SERVER_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          printf '%s\n' "$SERVER_KNOWN_HOSTS" > ~/.ssh/known_hosts
          chmod 600 ~/.ssh/known_hosts

      - name: Copy application files
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
        run: |
          rsync -az --delete \
            --exclude '.git/' \
            --exclude '.env' \
            --exclude 'backend/.env' \
            --exclude 'frontend/.env.local' \
            --exclude 'nginx/conf.d/10-app-https.conf' \
            --exclude 'certbot/www/' \
            --exclude 'backups/' \
            -e "ssh -i ~/.ssh/deploy_key" \
            ./ "$SERVER_USER@$SERVER_HOST:/opt/neurologist-website/"

      - name: Build and restart application
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
        run: |
          ssh -i ~/.ssh/deploy_key "$SERVER_USER@$SERVER_HOST" <<'REMOTE'
            set -eu
            cd /opt/neurologist-website

            docker compose --env-file .env -f docker-compose.production.yml config --quiet
            docker compose --env-file .env -f docker-compose.production.yml build
            docker compose --env-file .env -f docker-compose.production.yml up -d db
            docker compose --env-file .env -f docker-compose.production.yml run --rm backend alembic upgrade head
            docker compose --env-file .env -f docker-compose.production.yml up -d --remove-orphans
            docker compose --env-file .env -f docker-compose.production.yml ps

            curl --fail --silent --show-error http://127.0.0.1/health
          REMOTE
```

The workflow deliberately excludes `.env` and the active HTTPS file. Those are server-specific and must survive every deployment.

## 10. Test the first automatic deployment

Make a harmless committed change, such as correcting documentation, and push it:

```powershell
git add README.md
git commit -m "Test automatic deployment"
git push origin main
```

On GitHub, open the repository's **Actions** tab and select **Deploy production**.

A successful run should complete these stages:

1. Check out repository.
2. Configure SSH.
3. Copy application files.
4. Build and restart application.

Then verify:

```text
http://188.212.96.214/health
http://188.212.96.214/
```

## 11. If a deployment fails

Read the failed step in the GitHub Actions log. Then SSH to the server and inspect the containers:

```bash
cd /opt/neurologist-website
docker compose --env-file .env -f docker-compose.production.yml ps
docker compose --env-file .env -f docker-compose.production.yml logs --tail=200 backend frontend nginx db
```

Check the API directly on the server:

```bash
curl --fail http://127.0.0.1/health
```

If a build fails while downloading Python packages, confirm that the Runflare mirror in `backend/Dockerfile` is reachable.

## 12. Important safety rules

- Never commit `.env`, private keys, database backups, certificates, or uploaded patient files.
- Keep the production `.env` only on trusted computers and the VPS.
- Back up PostgreSQL and the uploads volume before risky database changes.
- Review database migrations before merging them into `main`.
- Do not use `docker compose down --volumes` in production; it would delete persistent data.
- Protect the GitHub `main` branch when the project becomes more mature.
- Later, add a test job before the deployment job so broken code cannot deploy.

This workflow is intentionally simple. A future version can add automated tests, image registries, staging deployments, approval gates, and automatic rollback after the basic process is familiar.
