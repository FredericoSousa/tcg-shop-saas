import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TCG Shop SaaS API",
      version: "1.0.0",
      description: "Complete API documentation for the TCG Shop SaaS platform",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", nullable: true },
            message: { type: "string", nullable: true },
            error: {
              type: "object",
              nullable: true,
              properties: {
                code: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
            meta: { type: "object", nullable: true },
          },
        },
      },
    },
  },
  apis: ["./src/app/api/**/*.ts", "./src/lib/infrastructure/http/*.ts"],
};

export const openApiSpec = swaggerJsdoc(options);
