import { verifyWebhook } from "@clerk/express/webhooks";
import { sql } from "../config/db.js";

export const handleClerkWebhook = async (req, res) => {
    try {
        const evt = await verifyWebhook(req);

        const eventType = evt.type;
        const data = evt.data;

        switch (eventType) {
            case "user.created": {
                const userId = data.id;
                const primaryEmail = data.email_addresses?.[0]?.email_address || "";
                const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";
                const image = data.image_url || "";
                const plan = data.public_metadata?.plan || "free";

                await sql`
                    INSERT INTO users (id, name, email, image, plan)
                    VALUES (${userId}, ${name}, ${primaryEmail}, ${image}, ${plan})
                    ON CONFLICT (id) DO UPDATE SET
                        email = EXCLUDED.email,
                        name = EXCLUDED.name,
                        image = EXCLUDED.image,
                        plan = EXCLUDED.plan,
                        updated_at = NOW()
                `;
                break;
            }

            case "user.updated": {
                const userId = data.id;
                const primaryEmail = data.email_addresses?.[0]?.email_address || "";
                const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";
                const image = data.image_url || "";
                const plan = data.public_metadata?.plan;

                if (plan) {
                    await sql`
                        INSERT INTO users (id, name, email, image, plan)
                        VALUES (${userId}, ${name}, ${primaryEmail}, ${image}, ${plan})
                        ON CONFLICT (id) DO UPDATE SET
                            email = EXCLUDED.email,
                            name = EXCLUDED.name,
                            image = EXCLUDED.image,
                            plan = EXCLUDED.plan,
                            updated_at = NOW()
                    `;
                } else {
                    await sql`
                        INSERT INTO users (id, name, email, image)
                        VALUES (${userId}, ${name}, ${primaryEmail}, ${image})
                        ON CONFLICT (id) DO UPDATE SET
                            email = EXCLUDED.email,
                            name = EXCLUDED.name,
                            image = EXCLUDED.image,
                            updated_at = NOW()
                    `;
                }
                break;
            }

            case "user.deleted": {
                const userId = data.id;
                if (userId) {
                    await sql`DELETE FROM users WHERE id = ${userId}`;
                }
                break;
            }

            default:
                console.log(`Unhandled clerk webhook event type: ${eventType}`);
        }

        return res.status(200).json({ success: true, eventType });

    } catch (error) {
        console.error("Error verifying Clerk Webhook:", error.message || error);
        return res.status(400).json({ error: "Webhook verification failed: " + (error.message || error) });
    }
};