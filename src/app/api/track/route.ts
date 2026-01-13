
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, update, increment, serverTimestamp, child, get } from "firebase/database";

export const dynamic = 'force-dynamic'; // Ensure the route is not cached

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("id");
    const emailId = searchParams.get("eid");

    // 1. Log the attempt
    console.log(`[Tracking] Pixel requested for Employee: ${employeeId}, Email: ${emailId}`);

    if (employeeId) {
        try {
            const updates: any = {};
            const basePath = `employee_inputs/${employeeId}`;
            let shouldIncrementGlobal = true;

            if (emailId) {
                // Check if already opened to prevent double counting in global metrics
                const dbRef = ref(db);
                const statusSnapshot = await get(child(dbRef, `${basePath}/emailHistory/${emailId}/status`));

                if (statusSnapshot.exists() && statusSnapshot.val() === "opened") {
                    shouldIncrementGlobal = false;
                }

                // Track specific email details
                updates[`${basePath}/emailHistory/${emailId}/status`] = "opened";
                updates[`${basePath}/emailHistory/${emailId}/openedAt`] = serverTimestamp();
                updates[`${basePath}/emailHistory/${emailId}/openCount`] = increment(1);
            }

            // Only increment global count if it's a new unique email open (or if we can't track uniqueness)
            if (shouldIncrementGlobal) {
                updates[`${basePath}/metrics/totalEmailsOpened`] = increment(1);
            }

            updates[`${basePath}/lastActiveAt`] = serverTimestamp();

            await update(ref(db), updates);
            console.log(`[Tracking] Successfully updated Firebase for ${employeeId}. Unique: ${shouldIncrementGlobal}`);
        } catch (error) {
            console.error("[Tracking] Error updating Firebase:", error);
        }
    }

    // 3. Return a 1x1 transparent GIF
    // Standard opaque 1x1 GIF: R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7
    // Standard transparent 1x1 GIF: R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7 (Wait, let me use a known transparent one)
    const transparentGif = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );

    return new NextResponse(transparentGif, {
        status: 200,
        headers: {
            "Content-Type": "image/gif",
            "Content-Length": transparentGif.length.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
