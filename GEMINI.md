# Project Overview

This is a web application built with React, Vite, TypeScript, and Tailwind CSS. It uses shadcn-ui for UI components and Supabase for the backend. The application features a comprehensive routing system for various pages, including a dashboard, user management, surveys, and commissions.

## Building and Running

To get the project up and running, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
    or if you use bun
    ```bash
    bun install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    or if you use bun
    ```bash
    bun run dev
    ```
    The application will be available at `http://localhost:8080`.

3.  **Build for production:**
    ```bash
    npm run build
    ```
    or if you use bun
    ```bash
    bun run build
    ```

4.  **Lint the code:**
    ```bash
    npm run lint
    ```
    or if you use bun
    ```bash
    bun run lint
    ```

## Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling, with a custom theme defined in `tailwind.config.ts`. It also utilizes `shadcn-ui` for a set of pre-built components.
*   **State Management:** The application uses `react-query` for data fetching and caching.
*   **Routing:** Routing is handled by `react-router-dom`.
*   **Backend:** The project is integrated with Supabase for backend services. The Supabase project ID is configured in `supabase/config.toml`.
*   **Code Quality:** The project uses ESLint for code linting.
*   **Path Aliases:** There is a path alias `@` configured in `vite.config.ts` that points to the `src` directory.
