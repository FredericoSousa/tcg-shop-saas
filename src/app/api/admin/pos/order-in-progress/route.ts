import { NextRequest, NextResponse, connection } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";

export async function GET(request: NextRequest) {
  await connection();
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "ID do cliente é obrigatório" },
        { status: 400 }
      );
    }

    const orderRepo = container.resolve<IOrderRepository>(TOKENS.OrderRepository);
    const order = await orderRepo.findPendingPOSOrder(customerId);

    if (!order) {
      return NextResponse.json({ success: true, data: null });
    }

    // Standardize items for the frontend cart
    const formattedItems = order.items?.map(item => {
      const product = (item as { product?: { name: string, imageUrl: string | null } }).product;
      return {
        id: item.id,
        name: product?.name || "Produto",
        imageUrl: product?.imageUrl,
        price: Number(item.priceAtPurchase),
        quantity: item.quantity,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        friendlyId: order.friendlyId,
        totalAmount: order.totalAmount,
        items: formattedItems,
      },
    });
  } catch (error) {
    console.error("Order in progress error:", error);
    const message = error instanceof Error ? error.message : "Erro ao buscar pedido em andamento";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
