#!/bin/bash

# Frontend Bundle Analyzer Script
# Comprehensive bundle analysis for Next.js Token Creator DApp

set -e

echo "📦 Frontend Bundle Analysis"
echo "=========================="

# Navigate to frontend directory
cd "$(dirname "$0")/.."

echo "📁 Working directory: $(pwd)"

# Check if Next.js project
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Install bundle analyzer if not present
echo "🔧 Checking bundle analyzer installation..."
if ! npm list @next/bundle-analyzer >/dev/null 2>&1; then
    echo "Installing @next/bundle-analyzer..."
    npm install --save-dev @next/bundle-analyzer
fi

# Create next.config.js with bundle analyzer if not exists
if [ ! -f "next.config.js" ]; then
    echo "⚙️ Creating next.config.js with bundle analyzer..."
    cat > next.config.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog'],
  },
  swcMinify: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production bundle optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          web3: {
            test: /[\\/]node_modules[\\/](viem|wagmi|@wagmi)[\\/]/,
            name: 'web3',
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
          },
          utils: {
            test: /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge)[\\/]/,
            name: 'utils',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
EOF
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next

# Build with analysis enabled
echo "🔨 Building with bundle analysis..."
ANALYZE=true NODE_ENV=production npm run build

# Generate detailed size reports
echo ""
echo "📊 Bundle Size Analysis"
echo "======================"

# Total build size
if [ -d ".next" ]; then
    echo "Total build size:"
    du -sh .next/ 2>/dev/null || echo "Unable to calculate total size"
    echo ""

    # Static chunks analysis
    if [ -d ".next/static/chunks" ]; then
        echo "Top 10 largest chunks:"
        du -sh .next/static/chunks/* 2>/dev/null | sort -hr | head -10
        echo ""

        echo "JavaScript bundle sizes:"
        find .next/static/chunks -name "*.js" -exec ls -lh {} \; | sort -k5 -hr | head -10
        echo ""
    fi

    # Page bundles
    if [ -d ".next/static/chunks/pages" ]; then
        echo "Page bundle sizes:"
        du -sh .next/static/chunks/pages/* 2>/dev/null | sort -hr
        echo ""
    fi
fi

# Check for large files (potential optimization targets)
echo "🔍 Files larger than 50KB (optimization candidates):"
find .next -name "*.js" -size +50k -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr

echo ""
echo "🔍 Files larger than 100KB (critical optimization targets):"
find .next -name "*.js" -size +100k -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr

# Analyze package.json for bundle size contributors
echo ""
echo "📋 Dependency Analysis"
echo "====================="

# Check for heavy dependencies
echo "Potentially heavy dependencies in package.json:"
grep -E "(viem|wagmi|@tanstack|@radix-ui|lucide-react)" package.json || echo "No heavy dependencies patterns found"

# Generate optimization recommendations
echo ""
echo "💡 Optimization Recommendations"
echo "==============================="

# Check for common optimization opportunities
if grep -q '"viem"' package.json; then
    echo "✅ viem found - Consider tree shaking Web3 utilities"
fi

if grep -q '"@radix-ui"' package.json; then
    echo "✅ Radix UI found - Ensure individual component imports"
fi

if grep -q '"lucide-react"' package.json; then
    echo "✅ Lucide React found - Consider custom icon subset"
fi

if [ -f "src/lib/wagmi.ts" ]; then
    echo "✅ Web3 configuration found - Verify minimal imports"
fi

# Create a simple bundle report
echo ""
echo "📈 Generating Bundle Report"
echo "=========================="

cat > bundle-report.md << EOF
# Bundle Analysis Report

**Date**: $(date)
**Tool**: Next.js Bundle Analyzer

## Bundle Sizes

### Build Directory Size
$(du -sh .next/ 2>/dev/null || echo "Unable to calculate")

### Top 5 Largest Chunks
$(du -sh .next/static/chunks/* 2>/dev/null | sort -hr | head -5)

### Optimization Opportunities
- Web3 libraries (viem, wagmi): Consider tree shaking
- UI components (@radix-ui): Ensure individual imports
- Icons (lucide-react): Consider custom subset
- Utilities: Bundle common utilities together

### Next Steps
1. Review bundle analyzer visualization
2. Implement tree shaking for large dependencies
3. Add dynamic imports for heavy components
4. Monitor bundle size changes in CI/CD

## Generated Files
- Bundle analyzer report: Open browser after build completes
- Build artifacts: .next/ directory
- Configuration: next.config.js updated
EOF

echo "📄 Bundle report saved to: bundle-report.md"

# Final instructions
echo ""
echo "🎯 Next Steps"
echo "============"
echo "1. Bundle analyzer will open in your browser automatically"
echo "2. Review the visual analysis at: http://localhost:3000"
echo "3. Look for optimization opportunities:"
echo "   - Large chunks that can be split"
echo "   - Duplicate dependencies across chunks"
echo "   - Unused code that can be tree-shaken"
echo ""
echo "🔧 To implement optimizations:"
echo "   - Update imports to be more specific"
echo "   - Add dynamic imports for heavy components"
echo "   - Configure webpack for better splitting"
echo ""
echo "📊 To re-run analysis:"
echo "   ANALYZE=true npm run build"
echo ""
echo "✅ Bundle analysis complete!"

# Open bundle analyzer if in interactive environment
if [ -t 1 ] && command -v open >/dev/null 2>&1; then
    echo "🌐 Opening bundle analyzer in browser..."
    sleep 2
    # The bundle analyzer should automatically open, but we can trigger it manually if needed
fi