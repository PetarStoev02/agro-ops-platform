# Agro Ops Platform

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) for managing agricultural operations and generating compliance documents.

## 📊 Data Schema Documentation

This project includes comprehensive documentation about the data structure and relationships:

- **[DATA_SCHEMA.md](./DATA_SCHEMA.md)** - Detailed text-based schema with all tables, fields, relationships, and missing data analysis
- **[DATA_SCHEMA_VISUAL.md](./DATA_SCHEMA_VISUAL.md)** - Visual diagrams and ER models using Mermaid syntax

### Quick Overview

The platform manages agricultural data through the following main entities:

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ SEASONS : "има"
    ORGANIZATIONS ||--o{ FIELDS : "има"
    ORGANIZATIONS ||--o{ ACTIVITIES : "има"
    ORGANIZATIONS ||--o{ INVENTORY : "има"
    SEASONS ||--o{ FIELDS : "включва"
    FIELDS ||--o{ ACTIVITIES : "има"
    INVENTORY ||--o{ ACTIVITIES : "използва се в"
```

**Main Data Entities:**
- **Organizations** - Farm/company information
- **Seasons** - Agricultural seasons/campaigns
- **Fields** - Agricultural fields/plots
- **Activities** - Farming activities (treatments, inspections, fertilization)
- **Inventory** - Warehouse stock (chemicals, fertilizers, seeds)
- **Diaries** - Field notes and logs
- **Credits** - Financial records
- **Audits** - Compliance audits
- **Reports** - Generated reports
- **Notifications** - User notifications

For complete documentation, see [DATA_SCHEMA.md](./DATA_SCHEMA.md) and [DATA_SCHEMA_VISUAL.md](./DATA_SCHEMA_VISUAL.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
