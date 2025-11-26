# B3 Widget Documentation Index

Complete guide to all widget documentation.

## 📚 For Users (Implementing Widgets)

### Main Documentation
**Location**: [`README.md`](./README.md)  
**Audience**: Developers adding widgets to their websites  
**Content**:
- Quick start guide
- Widget types and configuration
- Code examples
- Integration guides (WordPress, Webflow, Shopify)
- API reference
- Troubleshooting

**Start here if**: You want to add B3 widgets to your website

---

## 🛠️ For Developers (Building/Testing Widgets)

### Quick Start Guide
**Location**: [`../../apps/widget-demo/GETTING_STARTED.md`](../../../apps/widget-demo/GETTING_STARTED.md)  
**Audience**: Developers working on the widget system  
**Content**:
- E2E local testing instructions
- Step-by-step build process
- Troubleshooting common issues
- Development workflow

**Start here if**: You want to test widgets locally

### Technical Overview
**Location**: [`SUMMARY.md`](./SUMMARY.md)  
**Audience**: Developers understanding the architecture  
**Content**:
- What was built
- Architecture decisions
- Key features
- File structure
- Technical implementation details

**Start here if**: You want to understand how it works

### Development Roadmap
**Location**: [`TODO.md`](./TODO.md)  
**Audience**: Developers planning features  
**Content**:
- Completed tasks
- In-progress work
- Future enhancements
- Open questions

**Start here if**: You want to know what's next

### Quick Testing Guide
**Location**: [`../../WIDGET_QUICKSTART.md`](../../WIDGET_QUICKSTART.md)  
**Audience**: Developers testing the system  
**Content**:
- Build and test workflow
- Architecture diagrams
- Testing checklist
- Bundle optimization

**Start here if**: You want to test before deploying

---

## 🚀 For Deployers

### Deployment Guide
**Location**: [`../../apps/widget-demo/DEPLOYMENT.md`](../../../apps/widget-demo/DEPLOYMENT.md)  
**Audience**: Developers deploying the demo site  
**Content**:
- Railway deployment steps
- Build configuration
- Environment setup
- CDN vs local development
- Troubleshooting deployment issues

**Start here if**: You want to deploy the demo to Railway

### Demo App README
**Location**: [`../../apps/widget-demo/README.md`](../../../apps/widget-demo/README.md)  
**Audience**: Developers using the demo app  
**Content**:
- Demo app structure
- Quick start commands
- Example pages
- Widget SDK integration

**Start here if**: You're working with the demo app

---

## 📝 Reference Documentation

### Type Definitions
**Location**: [`types.ts`](./types.ts)  
**Content**: Complete TypeScript definitions for all widget types, events, and configuration

### Rename History
**Location**: [`RENAME_SUMMARY.md`](./RENAME_SUMMARY.md)  
**Content**: Documentation of "Paywall" → "Content Gate" rename and migration guide

---

## 🗺️ Documentation by Task

### "I want to add widgets to my website"
1. Read [`README.md`](./README.md) - Main documentation
2. Try the demo: Visit your deployed demo or run locally
3. Copy example code and customize

### "I want to test widgets locally"
1. Read [`../../apps/widget-demo/GETTING_STARTED.md`](../../../apps/widget-demo/GETTING_STARTED.md) - E2E setup
2. Follow the 6-step process
3. Open http://localhost:3000

### "I want to understand the architecture"
1. Read [`SUMMARY.md`](./SUMMARY.md) - Implementation overview
2. Read [`../../WIDGET_QUICKSTART.md`](../../WIDGET_QUICKSTART.md) - Technical details
3. Review [`types.ts`](./types.ts) - Type definitions

### "I want to deploy the demo"
1. Read [`../../apps/widget-demo/DEPLOYMENT.md`](../../../apps/widget-demo/DEPLOYMENT.md) - Deployment guide
2. Push to GitHub
3. Connect to Railway

### "I want to contribute"
1. Read [`TODO.md`](./TODO.md) - See what needs work
2. Read [`SUMMARY.md`](./SUMMARY.md) - Understand the system
3. Read [`../../apps/widget-demo/GETTING_STARTED.md`](../../../apps/widget-demo/GETTING_STARTED.md) - Set up dev environment

---

## 📂 File Structure

```
packages/sdk/src/widget/
├── README.md                       # 👈 Main user documentation
├── SUMMARY.md                      # 👈 Technical overview
├── TODO.md                         # 👈 Development roadmap
├── DOCUMENTATION_INDEX.md          # 👈 You are here
├── RENAME_SUMMARY.md               # Rename history
├── types.ts                        # Type definitions
├── manager.ts                      # Widget lifecycle
├── renderer.tsx                    # React roots
├── index.ts                        # CDN entry point
└── components/
    ├── WidgetWrapper.tsx
    └── widgets/
        ├── SignInWidget.tsx
        ├── ContentGateWidget.tsx
        └── ...

apps/widget-demo/
├── GETTING_STARTED.md              # 👈 E2E local testing
├── DEPLOYMENT.md                   # 👈 Deployment guide
├── README.md                       # 👈 Demo app overview
├── index.html                      # Full demo
└── examples/
    ├── basic.html
    └── content-gate.html

packages/sdk/
└── WIDGET_QUICKSTART.md            # 👈 Quick testing guide
```

---

## 🎯 Quick Links by Role

### Content Creator / Marketer
You want to add sign-in or content gating to your website:
- **Start**: [`README.md`](./README.md)
- **Examples**: Visit demo site or `apps/widget-demo/examples/`

### Frontend Developer
You want to integrate widgets into your app:
- **Start**: [`README.md`](./README.md)
- **Examples**: `apps/widget-demo/examples/`
- **API**: [`types.ts`](./types.ts)

### Widget Developer
You want to work on the widget system itself:
- **Start**: [`../../apps/widget-demo/GETTING_STARTED.md`](../../../apps/widget-demo/GETTING_STARTED.md)
- **Architecture**: [`SUMMARY.md`](./SUMMARY.md)
- **Roadmap**: [`TODO.md`](./TODO.md)

### DevOps / Deployment
You want to deploy the demo or CDN:
- **Start**: [`../../apps/widget-demo/DEPLOYMENT.md`](../../../apps/widget-demo/DEPLOYMENT.md)
- **Build**: [`../../WIDGET_QUICKSTART.md`](../../WIDGET_QUICKSTART.md)

---

## 📞 Getting Help

- **Usage questions**: See [`README.md`](./README.md)
- **Setup issues**: See [`../../apps/widget-demo/GETTING_STARTED.md`](../../../apps/widget-demo/GETTING_STARTED.md)
- **Deployment issues**: See [`../../apps/widget-demo/DEPLOYMENT.md`](../../../apps/widget-demo/DEPLOYMENT.md)
- **Contributing**: See [`TODO.md`](./TODO.md)

---

**Last Updated**: Nov 25, 2025

