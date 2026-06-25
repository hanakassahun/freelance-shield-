# Troubleshooting Guide

## If the server won't start:

1. **Check for syntax errors:**
   ```bash
   cd backend
   node server.js
   ```
   Look for any error messages in the console.

2. **Verify all dependencies are installed:**
   ```bash
   cd backend
   npm install
   ```

3. **Check if port 3001 is already in use:**
   - Windows: `netstat -ano | findstr :3001`
   - If something is using it, either stop that process or change the PORT in `.env`

## If the frontend won't start:

1. **Check for syntax errors:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verify all dependencies are installed:**
   ```bash
   cd frontend
   npm install
   ```

3. **Check if port 3000 is already in use**

## Common Issues:

### Database errors:
- The database file is created automatically at `backend/db/data.json`
- If you see database errors, delete `backend/db/data.json` and restart the server

### CORS errors:
- Make sure the backend is running on port 3001
- Check that `cors` is enabled in `backend/server.js`

### API connection errors:
- Verify the backend is running: visit `http://localhost:3001/api/health`
- Check the proxy configuration in `frontend/vite.config.js`

### Module import errors:
- Make sure you're using Node.js 18+ with ES modules support
- Check that all route files have `export default router` at the end

## Quick Start (if nothing works):

1. **Clean install:**
   ```bash
   # Delete node_modules in both folders
   rm -rf backend/node_modules frontend/node_modules
   
   # Reinstall
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start fresh:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Check the console output** for any specific error messages

## Still having issues?

Check the browser console (F12) and the terminal output for specific error messages. The error message will tell us exactly what's wrong.

