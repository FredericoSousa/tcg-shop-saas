import { ApiReference } from "@scalar/nextjs-api-reference";
import { openApiSpec } from "@/lib/infrastructure/openapi/openapi-config";

const config = {
  spec: {
    content: openApiSpec,
  },
  theme: "purple" as const,
  darkMode: true,
};

export const GET = ApiReference(config);
