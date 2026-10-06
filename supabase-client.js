/**
 * PROSPER MUSIC ACADEMY / PROSPERWORK
 * Supabase Realtime Database Sync Engine v4.0 (Sanitized Payload & Auto Initial Fetch)
 * Enables 0.1-second instant multi-device synchronization across ALL devices automatically.
 */

(function () {
    const SUPABASE_URL = "https://enweiyslfehpvvhidayv.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud2VpeXNsZmVocHZ2aGlkYXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDA4NDYsImV4cCI6MjEwNjc3Njg0Nn0.q6B2B9ce7peGzuAUSCxxO-40xBwvsBOuEfbwBP8w3fo";

    let supabaseClient = null;

    function cleanParentPayload(p) {
        if (!p) return null;
        return {
            id: String(p.id || ('PAR-' + Math.floor(1000 + Math.random() * 9000))),
            name: String(p.name || 'Parent'),
            relationship: String(p.relationship || 'Mother'),
            phone: String(p.phone || ''),
            email: String(p.email || ''),
            address: String(p.address || ''),
            student_ids: Array.isArray(p.student_ids) ? p.student_ids : [],
            status: String(p.status || 'ACTIVE').toUpperCase(),
            notes: String(p.notes || ''),
            updated_at: new Date().toISOString()
        };
    }

    function cleanStudentPayload(s) {
        if (!s) return null;
        return {
            id: String(s.id || ('SCH-' + Math.floor(1000 + Math.random() * 9000))),
            child_name: String(s.child_name || s.name || 'Student'),
            parent_name: String(s.parent_name || ''),
            whatsapp: String(s.whatsapp || ''),
            teacher: String(s.teacher || ''),
            days: String(s.days || ''),
            time: String(s.time || ''),
            status: String(s.status || 'ACTIVE').toUpperCase(),
            lesson_start: String(s.lesson_start || ''),
            admin: String(s.admin || 'Not Yet Assigned'),
            meet_link: String(s.meet_link || 'https://meet.google.com/hds-oijm-vkn'),
            zoom_link: String(s.zoom_link || ''),
            rate: parseFloat(s.rate) || 15,
            fee: parseFloat(s.fee) || 60,
            attended: parseInt(s.attended) || 0,
            missed: parseInt(s.missed) || 0,
            updated_at: new Date().toISOString()
        };
    }

    function cleanReschedulePayload(r) {
        if (!r) return null;
        return {
            id: String(r.id || ('RES-' + Math.floor(1000 + Math.random() * 9000))),
            student_id: String(r.student_id || ''),
            student_name: String(r.student_name || r.child_name || ''),
            parent_name: String(r.parent_name || ''),
            whatsapp: String(r.whatsapp || ''),
            teacher: String(r.teacher || ''),
            days: String(r.days || ''),
            time: String(r.time || ''),
            original_slot: String(r.original_slot || ''),
            rescheduled_date: r.rescheduled_date || null,
            admin: String(r.admin || 'Not Yet Assigned'),
            status: String(r.status || 'RESCHEDULED'),
            updated_at: new Date().toISOString()
        };
    }

    function cleanPaymentPayload(pay) {
        if (!pay) return null;
        return {
            id: String(pay.id || ('TXN-' + Math.floor(100000 + Math.random() * 900000))),
            parent_id: String(pay.parent_id || ''),
            parent_name: String(pay.parent_name || ''),
            student_name: String(pay.student_name || ''),
            amount: parseFloat(pay.amount) || 0,
            due_date: pay.due_date || null,
            payment_date: pay.payment_date || null,
            status: String(pay.status || 'UNPAID').toUpperCase(),
            method: String(pay.method || 'Bank Transfer'),
            notes: String(pay.notes || ''),
            parked_month: String(pay.parked_month || ''),
            updated_at: new Date().toISOString()
        };
    }

    function initSupabase() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log("⚡ Supabase Realtime Engine Connected!");
                subscribeRealtimeEvents();
                fetchInitialCloudData();
                return true;
            } catch (err) {
                console.warn("Supabase init warning:", err);
                return false;
            }
        } else {
            console.log("Supabase JS SDK loading...");
            return false;
        }
    }

    async function fetchInitialCloudData() {
        if (!supabaseClient) return;
        try {
            const data = await window.SupabaseEngine.fetchAllData();
            if (data && typeof window.onInitialCloudDataLoaded === 'function') {
                window.onInitialCloudDataLoaded(data);
            }
        } catch(e) { console.warn("Initial data fetch error:", e); }
    }

    function subscribeRealtimeEvents() {
        if (!supabaseClient) return;

        const channel = supabaseClient
            .channel('prosper-realtime-room')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'students' },
                (payload) => {
                    console.log("🔄 Realtime Student Update received:", payload);
                    if (typeof window.onRealtimeStudentUpdate === 'function') {
                        window.onRealtimeStudentUpdate(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'parents' },
                (payload) => {
                    console.log("🔄 Realtime Parent Update received:", payload);
                    if (typeof window.onRealtimeParentUpdate === 'function') {
                        window.onRealtimeParentUpdate(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reschedules' },
                (payload) => {
                    console.log("🔄 Realtime Reschedule Update received:", payload);
                    if (typeof window.onRealtimeRescheduleUpdate === 'function') {
                        window.onRealtimeRescheduleUpdate(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payment_transactions' },
                (payload) => {
                    console.log("🔄 Realtime Payment Update received:", payload);
                    if (typeof window.onRealtimePaymentUpdate === 'function') {
                        window.onRealtimePaymentUpdate(payload);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Supabase Realtime Channel Status:", status);
            });
    }

    // Export helpers to global window
    window.SupabaseEngine = {
        init: initSupabase,
        getClient: () => supabaseClient,

        async saveStudent(studentData) {
            if (!supabaseClient) return null;
            const cleaned = cleanStudentPayload(studentData);
            if (!cleaned) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('students')
                    .upsert(cleaned, { onConflict: 'id' })
                    .select();
                if (error) console.error("Error saving student to Supabase:", error);
                else console.log("⚡ Student saved to Supabase:", cleaned.child_name, cleaned.status);
                return data;
            } catch(e) { console.error("Supabase student save error:", e); return null; }
        },

        async deleteStudent(studentId) {
            if (!supabaseClient || !studentId) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('students')
                    .delete()
                    .eq('id', String(studentId));
                if (error) console.error("Error deleting student from Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase student delete error:", e); return null; }
        },

        async saveParent(parentData) {
            if (!supabaseClient) return null;
            const cleaned = cleanParentPayload(parentData);
            if (!cleaned) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('parents')
                    .upsert(cleaned, { onConflict: 'id' })
                    .select();
                if (error) console.error("Error saving parent to Supabase:", error);
                else console.log("⚡ Parent saved to Supabase:", cleaned.name, cleaned.status);
                return data;
            } catch(e) { console.error("Supabase parent save error:", e); return null; }
        },

        async deleteParent(parentId) {
            if (!supabaseClient || !parentId) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('parents')
                    .delete()
                    .eq('id', String(parentId));
                if (error) console.error("Error deleting parent from Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase parent delete error:", e); return null; }
        },

        async saveReschedule(reschData) {
            if (!supabaseClient) return null;
            const cleaned = cleanReschedulePayload(reschData);
            if (!cleaned) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('reschedules')
                    .upsert(cleaned, { onConflict: 'id' })
                    .select();
                if (error) console.error("Error saving reschedule to Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase reschedule save error:", e); return null; }
        },

        async deleteReschedule(reschId) {
            if (!supabaseClient || !reschId) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('reschedules')
                    .delete()
                    .eq('id', String(reschId));
                if (error) console.error("Error deleting reschedule from Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase reschedule delete error:", e); return null; }
        },

        async savePayment(paymentData) {
            if (!supabaseClient) return null;
            const cleaned = cleanPaymentPayload(paymentData);
            if (!cleaned) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('payment_transactions')
                    .upsert(cleaned, { onConflict: 'id' })
                    .select();
                if (error) console.error("Error saving payment to Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase payment save error:", e); return null; }
        },

        async deletePayment(paymentId) {
            if (!supabaseClient || !paymentId) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('payment_transactions')
                    .delete()
                    .eq('id', String(paymentId));
                if (error) console.error("Error deleting payment from Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase payment delete error:", e); return null; }
        },

        async fetchAllData() {
            if (!supabaseClient) return null;
            try {
                const [stdRes, parRes, resRes, payRes] = await Promise.all([
                    supabaseClient.from('students').select('*'),
                    supabaseClient.from('parents').select('*'),
                    supabaseClient.from('reschedules').select('*'),
                    supabaseClient.from('payment_transactions').select('*')
                ]);
                return {
                    students: stdRes.data || [],
                    parents: parRes.data || [],
                    reschedules: resRes.data || [],
                    payments: payRes.data || []
                };
            } catch(e) { console.error("Supabase fetch error:", e); return null; }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
})();
