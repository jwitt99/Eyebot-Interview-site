# Eyebot Interview - Real-time Chat Application

A real-time chat application built for the Eyebot interview.
Prompt: https://eyeballs.notion.site/Full-Stack-Engineer-Interview-Prompt-306fff2c9c5f803c86e8cef2b6916a4b#306fff2c9c5f80158a37ff4fbf052500

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Material-UI (MUI)
- Redux Toolkit
- React Router

### Backend
- Node.js (22.20)
- Express.js
- SSE
- File System (JSON database)

### Key Features
- Real-time messaging with SSE
- Live active user count
- Automatic online/offline status tracking
- Protected routes with authentication
- Type-safe development with TypeScript

### TODO: 
- Implement proper web sockets
- Add additional style sheets and consistent styling

## Running the Application

1. Install dependencies: `npm install`
2. Start the backend: `npm run server`
3. Start the frontend: `npm run dev`
4. Navigate to `http://localhost:5173`

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
