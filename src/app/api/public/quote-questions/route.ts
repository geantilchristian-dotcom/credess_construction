import {
  NextResponse,
} from "next/server";
import {
  getQuoteQuestions,
} from "@/lib/credess-data";
export const dynamic =
  "force-dynamic";
export async function GET() {
  try {
    const questions =
      await getQuoteQuestions();
    return NextResponse.json({
      success:
        true,
      questions,
    });
  }
  catch (
    error
  ) {
    return NextResponse.json(
      {
        success:
          false,
        message:
          error instanceof Error
            ? error.message
            : "Impossible de charger les questions.",
      },
      {
        status:
          500,
      }
    );
  }
}