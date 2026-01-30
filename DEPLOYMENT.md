# 🚀 Deployment Guide - iLoveSPSR Nellore

## Quick Start (5 minutes)

### Option 1: Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ilovespsrnellore

# 2. Build and run with Docker Compose
docker-compose up -d --build

# 3. Seed the database with demo data
docker exec -it ilovespsr-nellore node server/db/seed.js

# 4. Open your browser
# Visit: http://localhost:3001
```

### Option 2: Local Development

```bash
# 1. Clone and install dependencies
git clone <your-repo-url>
cd ilovespsrnellore
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env and update JWT_SECRET

# 3. Seed the database
npm run seed

# 4. Start the server
npm start

# 5. Open your browser
# Visit: http://localhost:3001
```

## 🌐 Cloud Deployment

### Deploy to Render.com (Free Tier)

1. **Create Account**: Sign up at [render.com](https://render.com)

2. **New Web Service**:
   - Connect your GitHub repository
   - Select "Docker" as deployment method
   - Render will auto-detect the Dockerfile

3. **Environment Variables** (Add in Render dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generate-a-secure-random-string>
   DB_PATH=/app/data/ilovespsr.db
   ```

4. **Deploy**: Click "Create Web Service"

5. **Seed Database** (One-time setup):
   ```bash
   # In Render shell
   node server/db/seed.js
   ```

### Deploy to Railway.app

1. **Create Account**: Sign up at [railway.app](https://railway.app)

2. **New Project**:
   - "Deploy from GitHub repo"
   - Select your repository

3. **Configure**:
   - Railway auto-detects Dockerfile
   - Add environment variables in Settings

4. **Deploy**: Automatic deployment on every git push

### Deploy to Fly.io

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Launch app
flyctl launch
# Follow prompts, select region

# 4. Deploy
flyctl deploy

# 5. Seed database
flyctl ssh console
node server/db/seed.js
exit
```

### Deploy to DigitalOcean App Platform

1. **Create App**: Go to App Platform in DigitalOcean

2. **Connect Repository**: Link your GitHub repo

3. **Configure**:
   - Type: Web Service
   - Dockerfile Path: `Dockerfile`
   - HTTP Port: 3001

4. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-secret>
   DB_PATH=/app/data/ilovespsr.db
   ```

5. **Deploy**: Click "Create Resources"

## 📦 Manual Deployment (VPS/EC2)

### Prerequisites
- Ubuntu 20.04+ / Debian 11+
- Node.js 18+ or Docker installed
- Domain name (optional)

### Using Docker on VPS

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose
sudo apt install docker-compose -y

# 4. Clone repository
git clone <your-repo-url>
cd ilovespsrnellore

# 5. Create .env file
nano .env
# Add your production values

# 6. Run with Docker Compose
sudo docker-compose up -d --build

# 7. Seed database
sudo docker exec -it ilovespsr-nellore node server/db/seed.js

# 8. Setup Nginx reverse proxy (optional)
sudo apt install nginx -y
```

### Nginx Configuration (Optional - for custom domain)

```nginx
# /etc/nginx/sites-available/ilovespsr
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ilovespsr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW/Security Groups)
- [ ] Regular backups of SQLite database
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Monitor logs: `docker-compose logs -f`

## 🗄️ Database Backup

### Backup SQLite Database

```bash
# Local backup
cp server/db/nellore.db backups/nellore-$(date +%Y%m%d).db

# Docker backup
docker exec ilovespsr-nellore sqlite3 /app/data/ilovespsr.db ".backup '/app/data/backup.db'"
docker cp ilovespsr-nellore:/app/data/backup.db ./backups/
```

### Automated Backups (Cron)

```bash
# Add to crontab
0 2 * * * docker exec ilovespsr-nellore sqlite3 /app/data/ilovespsr.db ".backup '/app/data/backup-$(date +\%Y\%m\%d).db'"
```

## 📊 Monitoring

### Health Check Endpoint
```
GET /api/health
```

### Docker Logs
```bash
docker-compose logs -f
docker-compose logs -f --tail=100
```

### Resource Usage
```bash
docker stats ilovespsr-nellore
```

## 🔄 Updates & Maintenance

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Check health
curl http://localhost:3001/api/health
```

## 🆘 Troubleshooting

### Container won't start
```bash
docker-compose down
docker-compose up --build
docker-compose logs
```

### Database locked error
```bash
# Stop all containers
docker-compose down

# Remove database locks
rm -f data/*.db-wal data/*.db-shm

# Restart
docker-compose up -d
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3002:3001"  # Use 3002 instead
```

## 💰 Cost Estimates

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Render.com | 750 hrs/month | $7/month |
| Railway.app | $5 credit/month | Pay as you go |
| Fly.io | 3 shared VMs | $1.94/month/VM |
| Vercel | Free (limited) | $20/month |
| DigitalOcean | - | $6/month droplet |
| AWS EC2 | 12 months free | $3.50/month (t2.micro) |

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs`
- Verify environment variables
- Ensure port 3001 is accessible
- Review [README.md](./README.md) for API documentation

---

**Made with ❤️ for SPSR Nellore, Andhra Pradesh 🇮🇳**
