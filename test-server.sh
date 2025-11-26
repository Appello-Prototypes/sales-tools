#!/bin/bash

echo "=== Testing Sales Tools Server ==="
echo ""

echo "1. Checking if server is running on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is NOT running on port 3000"
    exit 1
fi

echo ""
echo "2. Testing homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$STATUS" = "200" ]; then
    echo "✅ Homepage responds with 200"
else
    echo "❌ Homepage responds with $STATUS"
fi

echo ""
echo "3. Testing login page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login)
if [ "$STATUS" = "200" ]; then
    echo "✅ Login page responds with 200"
else
    echo "❌ Login page responds with $STATUS"
fi

echo ""
echo "4. Testing Google OAuth connect endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/auth/google/connect)
if echo "$RESPONSE" | grep -q "authUrl\|requiresConfiguration"; then
    echo "✅ Google OAuth endpoint is accessible"
    echo "   Response: $(echo $RESPONSE | head -c 100)..."
else
    echo "❌ Google OAuth endpoint error"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "5. Testing admin login endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}')
if echo "$RESPONSE" | grep -q "error\|Invalid"; then
    echo "✅ Admin login endpoint is accessible (expected error for test credentials)"
else
    echo "⚠️  Unexpected response: $RESPONSE"
fi

echo ""
echo "=== Test Complete ==="

