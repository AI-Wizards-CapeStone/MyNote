```bash
docker-compose --env-file .env.local up -d
npx prisma db pull
npx prisma generate
```