import { getAuth, clerkClient } from "@clerk/express";
import { sql } from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Not authorized, authentication required" });
        }

        // Verify if user exists in Neon DB
        let userResult = await sql`SELECT id, name, email, plan FROM users WHERE id = ${userId}`;

        if (userResult.length === 0) {
            // Automatically fetch and sync user from Clerk API
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                const primaryEmail = clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress 
                    || clerkUser.emailAddresses?.[0]?.emailAddress 
                    || "";
                const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") 
                    || clerkUser.username 
                    || "User";
                const image = clerkUser.imageUrl || "";
                const plan = clerkUser.publicMetadata?.plan || "free";

                userResult = await sql`
                    INSERT INTO users (id, name, email, image, plan)
                    VALUES (${userId}, ${name}, ${primaryEmail}, ${image}, ${plan})
                    ON CONFLICT (id) DO UPDATE SET
                        email = EXCLUDED.email,
                        name = EXCLUDED.name,
                        image = EXCLUDED.image,
                        plan = EXCLUDED.plan,
                        updated_at = NOW()
                    RETURNING id, name, email, plan
                `;
            } catch (clerkErr) {
                console.error("Error auto-syncing Clerk user to Neon DB:", clerkErr.message || clerkErr);
                userResult = await sql`
                    INSERT INTO users (id, name, email, plan)
                    VALUES (${userId}, 'User', ${userId + '@confera.user'}, 'free')
                    ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
                    RETURNING id, name, email, plan
                `;
            }
        }

        req.user = {
            id: userId,
            name: userResult[0]?.name || "User",
            email: userResult[0]?.email || "",
            plan: userResult[0]?.plan || "free",
        };

        next();
    } catch (err) {
        console.error("Error in protect middleware:", err);
        return res.status(500).json({ error: "Authentication verification failed" });
    }
};