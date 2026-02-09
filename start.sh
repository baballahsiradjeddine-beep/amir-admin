#!/bin/bash

# 🚀 Quick Start Guide - تطبيق إدارة رأس المال

echo "==================================="
echo "✨ تطبيق إدارة رأس المال + Supabase"
echo "==================================="
echo ""

# Check Node.js
echo "📋 التحقق من المتطلبات..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً"
    exit 1
fi
echo "✅ Node.js مثبت: $(node -v)"
echo ""

# Install dependencies
echo "📦 تثبيت المكتبات..."
npm install
echo "✅ تمت عملية التثبيت"
echo ""

# Run development server
echo "🚀 بدء خادم التطوير..."
echo ""
echo "الصفحات المتاحة:"
echo "  🏠 الصفحة الرئيسية: http://localhost:3000/dashboard"
echo "  🏢 الشركات: http://localhost:3000/dashboard/companies"
echo "  📦 المزودون: http://localhost:3000/dashboard/fournisseurs"
echo "  📊 الإحصائيات: http://localhost:3000/dashboard/stats"
echo "  💰 المعاملات: http://localhost:3000/dashboard/transactions"
echo "  ⚙️  الإعدادات: http://localhost:3000/dashboard/settings"
echo ""
echo "⏱️  الانتظار 3 ثوان..."
sleep 3
npm run dev
