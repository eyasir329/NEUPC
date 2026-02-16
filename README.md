# NEUPC Website

Official website for **Netrokona University Programming Club (NEUPC)** - empowering students through competitive programming, workshops, and collaborative learning.

## 🚀 Features

- **Role-Based Access**: 6 user roles (Guest, Member, Executive, Admin, Mentor, Advisor) with tailored experiences
- **Event Management**: Organize workshops, contests, bootcamps, and hackathons
- **Member Portal**: Track competitive programming stats, achievements, and certificates
- **Content Platform**: Blogs, roadmaps, and curated learning resources
- **Mentorship Program**: Connect mentors with mentees for guided learning
- **Contest Integration**: Track participation and performance across platforms
- **Discussion Forums**: Community Q&A and knowledge sharing
- **Analytics Dashboard**: Insights for club leaders and advisors

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: Custom components with Lucide React icons
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Git

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/eyasir329/neupc.git
cd neupc
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create `.env.local` from example:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Netrokona University Programming Club"
```

### 4. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor in Supabase dashboard
3. Copy and run the complete schema from `docs/database-schema.sql`

**Or** follow the detailed guide: [Database Setup Guide](docs/database-documentation.md)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the website.

## 📚 Documentation

### Database

- **[Database Schema](docs/database-schema.sql)** - Complete SQL schema (45+ tables)
- **[Database Documentation](docs/database-documentation.md)** - Detailed docs with ERD and relationships
- **[Database Quick Reference](docs/database-quick-reference.md)** - Common queries and patterns

### Setup Guides

- **[Next.js Project Setup](docs/nextjs-project-setup.md)** - Complete setup instructions
- **[Giscus Setup](docs/giscus-setup-guide.md)** - Comment system integration

## 🏗️ Project Structure

```
neupc/
├── app/
│   ├── _components/       # Reusable components
│   │   ├── features/      # Feature-specific components
│   │   ├── layout/        # Layout components (Header, Footer)
│   │   ├── sections/      # Page sections (Hero, Events, Navigation)
│   │   └── ui/           # UI primitives (Logo, SVG, Wave)
│   ├── _lib/             # Utilities and configurations
│   ├── _styles/          # Global styles and theme
│   ├── about/            # Static pages
│   ├── events/           # Dynamic event pages
│   ├── blogs/            # Blog section
│   ├── account/          # User dashboard & panels
│   └── ...               # Other routes
├── docs/                 # Documentation
├── public/               # Static assets
└── README.md
```

## 🎨 Design System

### Colors

- **Primary**: Teal/Cyan (#088395) - Professional, tech-focused
- **Secondary**: Complementary accents
- **Background**: Light (#EBF4F6) / Dark mode support

### Typography

- **Headings**: Space Grotesk (modern, techy)
- **Body**: Inter (readable, professional)
- **Code**: JetBrains Mono (developer-friendly)

### Components

- Custom button variants (primary, secondary, ghost)
- Card components with hover effects
- Responsive navigation with dropdown menus
- Loading states and animations

## 🔐 Role System

### User Roles

1. **Guest** (Priority 1)
   - View public content
   - Browse events and blogs
   - Contact form access

2. **Member** (Priority 2)
   - Personal dashboard
   - Contest registration
   - Discussion participation
   - Track achievements and statistics

3. **Mentor** (Priority 3)
   - Mentee management
   - Session scheduling
   - Progress tracking
   - Resource sharing

4. **Executive** (Priority 4)
   - Event management
   - Content creation
   - Member oversight
   - Analytics access

5. **Advisor** (Priority 5)
   - Club oversight
   - Event approval
   - Budget tracking
   - Performance reports

6. **Admin** (Priority 6)
   - Full system access
   - User management
   - System settings
   - Security logs

## 🚦 Development Workflow

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Code Style

- ESLint with Next.js config
- Prettier with Tailwind plugin
- Conventional commits recommended

## 📊 Database Features

- **45+ Tables**: Comprehensive schema for all features
- **Row-Level Security**: Supabase RLS policies for data protection
- **Audit Logging**: Activity tracking for important operations
- **Performance**: Comprehensive indexing and optimized queries
- **Analytics Views**: Pre-built views for common analytics queries

See [Database Documentation](docs/database-documentation.md) for complete details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Netrokona University Programming Club**

- Website: [Coming Soon]
- Email: <contact@neupc.edu>
- GitHub: [@eyasir329](https://github.com/eyasir329)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Tailwind CSS for styling utilities
- All contributors and club members

## 📞 Support

For issues and questions:

- Open an issue on [GitHub](https://github.com/eyasir329/neupc/issues)
- Contact the development team
- Check [documentation](docs/)

---

**Built with ❤️ by NEUPC Development Team**
