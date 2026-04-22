import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/gif",
];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_FOLDERS = ["tenant-logos", "tenant-favicons", "products"];

/**
 * @openapi
 * /api/admin/upload:
 *   post:
 *     summary: Upload an image
 *     description: Uploads an image file to Supabase Storage. Requires admin authentication.
 *     tags: [Upload]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               folder: { type: string, enum: [tenant-logos, tenant-favicons, products] }
 *     responses:
 *       200:
 *         description: Upload successful, returns public URL
 */
export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "general";

      if (!file) {
        return ApiResponse.badRequest("Nenhum arquivo enviado.");
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return ApiResponse.badRequest(
          "Tipo de arquivo não permitido. Use: JPEG, PNG, WebP, SVG, ICO ou GIF."
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return ApiResponse.badRequest("Arquivo muito grande. Máximo: 2MB.");
      }

      const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : "general";
      const ext = file.name.split(".").pop() || "png";
      const timestamp = Date.now();
      const storagePath = `${tenant.id}/${safeFolder}/${timestamp}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        logger.error("Supabase upload error", uploadError as Error, {
          tenantId: tenant.id,
          storagePath,
        });
        return ApiResponse.serverError("Falha no upload da imagem.");
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      return ApiResponse.success({ url: publicUrl });
    } catch (error) {
      logger.error("Error uploading image", error as Error, {
        tenantId: tenant.id,
      });
      return ApiResponse.serverError();
    }
  });
}
