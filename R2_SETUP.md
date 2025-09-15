# Cloudflare R2 Setup Guide

## Environment Variables

Add these to your Railway environment variables:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-r2-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Optional: Custom Domain (for branded URLs)
R2_PUBLIC_BASE_URL=https://your-custom-domain.com
```

## Getting R2 Credentials

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to R2 Object Storage

2. **Create R2 Bucket**
   - Click "Create bucket"
   - Choose a unique bucket name
   - Select location (auto is fine)

3. **Get API Tokens**
   - Go to "Manage R2 API tokens"
   - Click "Create API token"
   - Select permissions: Object Read & Write
   - Copy Access Key ID and Secret Access Key

4. **Find Account ID**
   - Right sidebar in Cloudflare dashboard
   - Copy Account ID

5. **Set Endpoint**
   - Format: `https://<account-id>.r2.cloudflarestorage.com`
   - Replace `<account-id>` with your actual Account ID

## Testing

Test the upload functionality:

```bash
# 1. Get presigned URL
curl -X POST https://your-app.railway.app/api/r2-presign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"pageId":"test","fileName":"test.jpg","contentType":"image/jpeg"}'

# 2. Upload file using the returned uploadUrl
curl -X PUT -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg \
  "presigned-url-from-step-1"
```

## Custom Domain (Optional)

1. **Set up Custom Domain in R2**
   - In R2 dashboard, go to your bucket
   - Click "Settings" → "Custom Domains"
   - Add your domain (e.g., cdn.yourdomain.com)

2. **Update Environment**
   - Set `R2_PUBLIC_BASE_URL=https://cdn.yourdomain.com`
   - Redeploy application

3. **Benefits**
   - Branded URLs
   - Better caching control
   - SEO benefits

## Migration from Supabase Storage

The system now uses R2 for new uploads while maintaining compatibility with existing Supabase Storage URLs. No data migration needed - old images continue to work.
