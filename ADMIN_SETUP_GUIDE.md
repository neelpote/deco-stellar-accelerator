# Admin Setup Guide - Fix for Approval Errors

## 🚨 Current Issue
The admin approval is failing with "Bad union switch: 4" error. This typically means:
1. The wallet doesn't have the correct admin account imported
2. The startup application doesn't exist
3. The application is already approved

## 🔒 Security Fix Applied
**IMPORTANT:** The admin dashboard is now properly secured and will only be visible to the actual admin account. Non-admin users will no longer see the admin tab or admin badge.

## 🔍 New Debug Feature
The AdminView now includes a "🔍 Verify Admin" button that will:
- Check if your current wallet matches the contract's admin address
- Show you the expected admin address
- Provide the admin secret key if needed

## ✅ Solution

### Step 1: Import Admin Account into Freighter Wallet

1. **Open Freighter Wallet Extension**
2. **Click on the account dropdown** (top right)
3. **Click "Import Account"**
4. **Enter the Admin Secret Key:**
   ```
   SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2
   ```
5. **Give it a name:** `DeCo Admin`
6. **Click Import**

### Step 2: Switch to Admin Account

1. **Click on the account dropdown**
2. **Select "DeCo Admin"** (the account you just imported)
3. **Refresh the DeCo application**
4. **You should now see the "👑 ADMIN" badge**

### Step 3: Test Admin Functions

1. **Go to Admin tab**
2. **Try approving an application**
3. **The approval should now work!**

## 📋 Admin Account Details

- **Admin Address:** `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
- **Admin Secret:** `SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2`
- **Contract ID:** `CAKHYOFVLMGRO66VA2GQ6YG4FJZN3N4QGWMM342P3645RQZDKE6PAQUZ`

## 🔧 What Was Fixed

1. **🔒 SECURITY FIX:** Admin dashboard now only visible to actual admin account
2. **Fixed Soroban RPC URL** - Removed `:443` port that was causing network errors
3. **Added Address Validation** - Better error handling for invalid addresses
4. **Improved Error Messages** - More descriptive error messages for debugging
5. **Wallet Connection Validation** - Validates Stellar address format on connection
6. **Admin Access Control** - Prevents unauthorized access to admin functions

## 🧪 Testing Steps

1. **Import admin account** (Step 1-2 above)
2. **Click "🔍 Verify Admin" button** in the admin dashboard to confirm setup
3. **Submit an application** as a founder (different account)
4. **Switch to admin account**
5. **Go to Admin tab**
6. **Review the application** (enter founder address)
7. **Approve the application**
8. **Success!** ✅

## 🚨 Common Issues

### "Invalid version byte" Error
- **Cause:** Invalid Stellar address format
- **Fix:** Make sure you're using valid Stellar addresses (starting with G)

### "Bad union switch: 4" Error  
- **Cause:** Contract panic (admin mismatch, missing startup, or already approved)
- **Fix:** 
  1. Use the "🔍 Verify Admin" button to check admin status
  2. Ensure the founder has submitted an application first
  3. Check if the application is already approved
  4. Make sure you're using the correct admin account

### "Network Error"
- **Cause:** RPC endpoint issues
- **Fix:** Already fixed by removing `:443` from RPC URL

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Make sure you're using the correct admin secret key
3. Ensure the founder has actually submitted an application first
4. Try refreshing the page after switching accounts

The application should now work perfectly! 🎉