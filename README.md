# NueCMS DI

A lightweight Node.js application with a custom Dependency Injection (DI) framework, route decorators, and Swagger/OpenAPI integration for API documentation.



## Features

- **Custom Dependency Injection**: A simple DI container for managing dependencies.
- **Route Decorators**: Use `@Controller`, `@Get`, and `@Post` for defining routes.
- **Validation**: Request validation with `@Validate` using `class-validator`.
- **Swagger/OpenAPI Integration**: Automatic API documentation generation based on JSDoc and metadata.
- **Modular Architecture**: Clear separation of concerns between controllers, services, and utilities.


## Getting Started

### Prerequisites

- **Node.js**: v18 or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nuecms/di.git
   cd di
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Access the API:
   - API Base URL: `http://localhost:3000`
   - Swagger Docs: `http://localhost:3000/api-docs`

### Building for Production

To build and run the project in production:
```bash
npm run build
npm start
```

### nuxt runtime/build config


In `nuxt.config.ts` add the following code:

to in nuxt project, you need to install  `vite-ts-decorators`.

```ts
  hooks: {
    // https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/core/nitro.ts#L407
    'nitro:init': (nitro: Nitro) => {
      nitro.hooks.hook('rollup:before', (nitro, rollupConfig) => {
        if (Array.isArray(rollupConfig.plugins)) {
          const index = rollupConfig.plugins.findIndex((plugin) => plugin && 'name' in plugin && plugin.name === 'esbuild');
          rollupConfig.plugins.splice(index, 0, {
            ...viteDecorators({
              tsconfig: path.resolve(__dirname, 'tsconfig.json'),
              force: true,
              srcDir: 'server/**/*.ts', // Optional: Glob pattern for finding source files
            }),
            enforce: null,
          });
        }
      })
    },
    'nitro:build:before': (nitro: Nitro) => {
      nitro.options.moduleSideEffects.push('reflect-metadata')
    }
  },
```


## Example Usage

### API Endpoints

#### 1. Get All Users
- **GET** `/users`
- Response:
  ```json
  []
  ```

#### 2. Create User
- **POST** `/users`
- Request Body:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
  ```
- Response:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
  ```

### Validation

Request body validation is powered by `class-validator`:
- Add a DTO class (e.g., `CreateUserDto`) in the `controllers/dtos` directory.
- Use `@Validate` to enforce validation rules.

### Swagger Documentation

Swagger UI is automatically generated:
- Annotate methods with JSDoc comments.
- Use decorators to define routes and validation.
- Accessible at `/api-docs`.

## Technologies Used

- **Node.js**: JavaScript runtime.
- **Express**: Web framework for Node.js.
- **TypeScript**: Static typing for JavaScript.
- **class-validator**: Validation for DTOs.
- **swagger-ui-express**: API documentation.

## Roadmap

- Add support for custom middlewares.
- Implement dynamic route loading.
- Extend DI with lifecycle management.
- Introduce unit and integration tests.

## Credits

This project was bootstrapped with [Node.js Decorators](https://github.com/serhiisol/node-decorators).


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
