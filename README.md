# Hazert

A modern full-stack React application built with TanStack Start, featuring advanced routing, state management, and data fetching capabilities.

## 🚀 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React with file-based routing
- **Routing**: [TanStack Router](https://tanstack.com/router) - Type-safe routing with file-based routes
- **State Management**: [TanStack Store](https://tanstack.com/store) - Reactive state management
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) - Server state management
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com) with Radix UI primitives
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) - Utility-first CSS framework
- **Type Safety**: [TypeScript](https://typescriptlang.org) with strict configuration
- **Code Quality**: [Biome](https://biomejs.dev) - Fast linting and formatting
- **Package Manager**: [pnpm](https://pnpm.io) - Fast, disk space efficient

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Ashrafulgafurtantan/hazert.git
cd hazert

# Install dependencies
pnpm install
```

## 🛠️ Development

```bash
# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Preview production build
pnpm serve
```

## 🧪 Testing

```bash
# Run tests
pnpm test
```

## 🔧 Code Quality

```bash
# Run all checks (lint, format, organize imports)
pnpm check

# Lint only
pnpm lint

# Format entire project
pnpm format
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Shadcn/ui components
├── features/           # Feature-based modules
├── integrations/       # Third-party integrations
├── lib/               # Utilities and configurations
├── routes/            # File-based routing
└── styles/            # Global styles
```

## 🎯 Key Features

- **File-based Routing**: Automatic route generation from file structure
- **Type-safe Navigation**: Full TypeScript support for routes and parameters  
- **Server Functions**: Built-in server-side functionality with validation
- **State Management**: Reactive stores with derived state support
- **Data Fetching**: Integrated React Query for server state
- **Code Quality**: Automated linting, formatting, and import organization
- **Development Tools**: Router, Query, and Store devtools in development

## 📚 Architecture Patterns

### Routing
- File-based routes in `src/routes/`
- Type-safe navigation with params objects
- Server-side rendering and data loading

### State Management
- TanStack Store for global state
- Derived stores for computed values
- React hooks integration

### Data Fetching
- TanStack Query for server state
- Server functions with Zod validation
- Proper loading states and error handling

## 🎨 UI Components

Built with Shadcn/ui components that can be easily added:

```bash
pnpx shadcn@latest add [component-name]
```

## 📖 Development Guidelines

This project follows strict development rules for consistency and quality. Key guidelines:

- **Navigation**: Use params object for dynamic routes, avoid template literals
- **Forms**: TanStack Form with composition patterns and Zod validation
- **Server Functions**: All database operations through server functions with validation
- **Code Style**: 2-space indentation, double quotes, self-closing tags
- **Type Safety**: Strict TypeScript with proper validation schemas

## 🚀 Deployment

The application is ready for deployment on various platforms with proper build optimization and environment configuration.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.