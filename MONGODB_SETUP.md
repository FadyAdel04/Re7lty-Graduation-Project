# MongoDB Atlas Setup Guide

## Issue: Database Connection Failed

If you're seeing this error:
```
MongoDB connection failed: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Whitelist Your IP Address

### Step 1: Get Your Current IP Address

1. Visit: https://whatismyipaddress.com/
2. Copy your public IP address (IPv4)

### Step 2: Add IP to MongoDB Atlas Whitelist

1. Log in to MongoDB Atlas: https://cloud.mongodb.com/
2. Go to your project/cluster
3. Click on **"Network Access"** in the left sidebar
4. Click **"Add IP Address"** button
5. Choose one of these options:
   - **Add Current IP Address** (recommended for development)
   - **Allow Access from Anywhere** (0.0.0.0/0) - ⚠️ Less secure, only for testing
6. Click **"Confirm"**
7. Wait 1-2 minutes for the changes to propagate

### Step 3: Verify Connection String

Make sure your `.env` file has the correct MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/re7lty?retryWrites=true&w=majority
```

Replace:
- `username` with your MongoDB Atlas username
- `password` with your MongoDB Atlas password
- `cluster` with your cluster name
- `re7lty` with your database name

### Step 4: Test Connection

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see:
   ```
   ✓ MongoDB connected successfully
   ```

## Alternative: Use Local MongoDB

If you prefer to use a local MongoDB instance:

1. Install MongoDB Community Edition: https://www.mongodb.com/try/download/community

2. Update your `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/re7lty
   ```

3. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   ```

## Troubleshooting

### Still Can't Connect?

1. **Check Firewall**: Make sure your firewall allows connections to MongoDB
2. **Check Network**: Ensure you're on the same network as when you whitelisted the IP
3. **Check Connection String**: Verify username, password, and cluster name are correct
4. **Check Atlas Status**: Visit https://status.mongodb.com/ to check if there are any outages

### Quick Test

Test your connection string directly:
```bash
# Replace with your actual connection string
mongosh "mongodb+srv://username:password@cluster.mongodb.net/re7lty"
```

If this works, the issue is with the application configuration. If it doesn't, the issue is with MongoDB Atlas setup.

## Security Notes

- ⚠️ **Never commit your `.env` file** to version control
- ⚠️ **Use environment-specific IP whitelists** (different for dev/staging/prod)
- ✅ **Use strong passwords** for MongoDB Atlas users
- ✅ **Enable MongoDB Atlas authentication** (username/password)

## Need Help?

- MongoDB Atlas Documentation: https://www.mongodb.com/docs/atlas/
- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas/support/

