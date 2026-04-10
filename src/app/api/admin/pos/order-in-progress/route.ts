import { NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
    const formattedItems = order.items?.map(item => ({
      id: item.productId || "",
      name: (item as any).product?.name || "Produto", // Repository include product
      imageUrl: (item as any).product?.imageUrl,
      price: Number(item.priceAtPurchase),
      quantity: item.quantity,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        friendlyId: order.friendlyId,
        totalAmount: order.totalAmount,
        items: formattedItems,
      },
    });
  } catch (error: any) {
    console.error("Order in progress error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar pedido em andamento" },
      { status: 500 }
    );
  }
}
