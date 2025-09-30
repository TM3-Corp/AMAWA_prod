# 🚀 AMAWA Production Setup Guide

## Quick Setup Checklist

### ✅ Cloud Services Status
- [ ] Supabase project created (São Paulo region)
- [ ] Upstash Redis created (São Paulo region) 
- [ ] Vercel account connected to GitHub
- [ ] Environment variables configured

## 🔑 Environment Variables

Create `.env.local` file with your actual values:

```bash
# From Supabase > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY

# From Supabase > Settings > Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# From Upstash Dashboard
UPSTASH_REDIS_REST_URL=https://YOUR_ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
```

## 🖥️ Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Production URLs

- **Main App**: https://amawa-prod.vercel.app
- **Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT
- **Vercel Dashboard**: https://vercel.com/tm3-corp/amawa-prod

## 📊 Monitoring

### Check Service Health:
1. **Vercel**: Check Functions tab for API logs
2. **Supabase**: Monitor Database > Query Performance
3. **Upstash**: Check Redis metrics dashboard

### Daily Tasks:
- [ ] Check error logs in Vercel
- [ ] Monitor database size in Supabase
- [ ] Review Redis usage in Upstash

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working
- Vercel: Redeploy after adding variables
- Local: Restart dev server after changing .env.local

## 📞 Support

- **Supabase**: support.supabase.com
- **Vercel**: vercel.com/support
- **Upstash**: docs.upstash.com

---

Remember: All services are on FREE tier initially. Monitor usage to avoid surprises!