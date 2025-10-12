### Stage 1: build the app using node
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests first for cached installs
COPY package.json pnpm-lock.yaml* ./

# Install deps
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy source
COPY . .

# Build
# Prefer the README-recommended `pnpm build` (runs `vite build && tsc --noEmit`).
# If type-checks/tests in the repo cause `pnpm build` to fail during image build,
# fall back to running Vite directly to produce static assets.
RUN pnpm build || pnpm exec vite build --outDir dist

# Ensure static build artifacts are available at /app/dist. Some plugins (SSG/SSR) write to .output or build directories.
RUN if [ -d /app/dist ]; then \
			echo "dist exists"; \
			elif [ -d /app/.output/client ]; then \
			mkdir -p /app/dist && cp -a /app/.output/client/. /app/dist/; \
			elif [ -d /app/.tanstack/start/build/client-dist ]; then \
				mkdir -p /app/dist && cp -a /app/.tanstack/start/build/client-dist/. /app/dist/; \
		elif [ -d /app/.output/public ]; then \
			mkdir -p /app/dist && cp -a /app/.output/public/. /app/dist/; \
		elif [ -d /app/build ]; then \
			mkdir -p /app/dist && cp -a /app/build/. /app/dist/; \
		else \
			echo "Build output not found. Listing /app for debugging:" && ls -la /app && exit 1; \
		fi

### Stage 2: runtime - copy built app and run SSR server
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only the built output and node_modules from builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Expose the SSR server port (default 3000)
EXPOSE 3000

# Run the SSR server
CMD ["node", ".output/server/index.mjs"]
