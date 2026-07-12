export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = String(body.pin ?? "");
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      return Response.json(
        {
          success: false,
          error: "ADMIN_PIN не настроен",
        },
        {
          status: 500,
        }
      );
    }

    if (pin !== adminPin) {
      return Response.json(
        {
          success: false,
          error: "Неверный PIN-код",
        },
        {
          status: 401,
        }
      );
    }

    return Response.json({
      success: true,
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: "Некорректный запрос",
      },
      {
        status: 400,
      }
    );
  }
}