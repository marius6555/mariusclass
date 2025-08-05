
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Student } from "@/types";

const ADMIN_EMAIL = "tingiya730@gmail.com";

export async function getAdminDetails() {
    try {
        const q = query(collection(db, "students"), where("email", "==", ADMIN_EMAIL));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data() as Student;
            return {
                name: adminData.name,
                email: adminData.email || ADMIN_EMAIL,
                whatsapp: adminData.whatsapp || "Not available"
            };
        }
        return { name: 'Admin', email: ADMIN_EMAIL, whatsapp: 'Not available' };
    } catch (error) {
        console.error("Error fetching admin details:", error);
        // Fallback in case of error
        return { name: 'Admin', email: ADMIN_EMAIL, whatsapp: 'Not available' };
    }
}
