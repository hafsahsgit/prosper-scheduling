/**
 * PROSPER MUSIC ACADEMY / PROSPERWORK
 * Supabase Realtime Database Sync Engine v4.0 (Sanitized Payload & Auto Initial Fetch)
 * Enables 0.1-second instant multi-device synchronization across ALL devices automatically.
 */

(function () {
    const SUPABASE_URL = "https://vaglvmzknswfrjgnrcce.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ2x2bXprbnN3ZnJqZ25yY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjk2NjEsImV4cCI6MjEwNjg0NTY2MX0.yxpR4hxppfLeJej5Y-XD5vnvt1trPfUM7-Kt3uAj6J4";

    let supabaseClient = null;

    function cleanParentPayload(p) {
        if (!p) return null;
        const name = String(p.name || 'Parent').trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pId = p.id && !String(p.id).match(/^PAR-\d{4}$/) ? String(p.id).trim() : ('PAR-' + (slug || 'unassigned'));
        return {
            id: pId,
            name: name,
            relationship: String(p.relationship || 'Mother'),
            phone: String(p.phone || ''),
            email: String(p.email || (slug ? `${slug}@example.com` : '')),
            address: String(p.address || 'London, United Kingdom'),
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
        
        let dateVal = null;
        const rawDate = r.rescheduled_date || r.reschedule_date || r.date || r.scheduled_date || '';
        const matchIso = String(rawDate).match(/\d{4}-\d{2}-\d{2}/);
        if (matchIso) {
            dateVal = matchIso[0];
        }

        const rawDayTime = r.reschedule_date || r.rescheduled_date || '';
        const dayVal = r.days || (rawDayTime ? String(rawDayTime).split(' ')[0] : 'Monday');
        const timeVal = r.time || (rawDayTime ? String(rawDayTime).split(' ').slice(1).join(' ') : '05:00:pm');

        const name = String(r.student_name || r.child_name || 'Student').trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');

        return {
            id: String(r.id || ('RES-' + slug + '-' + Date.now())),
            student_id: String(r.student_id || ''),
            student_name: name,
            parent_name: String(r.parent_name || ''),
            whatsapp: String(r.whatsapp || ''),
            teacher: String(r.teacher || 'Unassigned'),
            days: String(dayVal),
            time: String(timeVal),
            original_slot: String(r.original_slot || r.scheduled_date || ''),
            rescheduled_date: dateVal,
            admin: String(r.admin || 'Office'),
            status: String(r.status || 'CONFIRMED'),
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

    function cleanAttendanceLogPayload(log) {
        if (!log) return null;
        let sId = String(log.student_id || '');
        if (sId && window.appState && Array.isArray(window.appState.students)) {
            const found = window.appState.students.some(s => String(s.id).toLowerCase() === sId.toLowerCase());
            if (!found) {
                const foundByName = window.appState.students.find(s => 
                    (s.child_name && log.student_name && s.child_name.toLowerCase() === String(log.student_name).toLowerCase())
                );
                if (foundByName) {
                    sId = String(foundByName.id);
                } else {
                    sId = null;
                }
            }
        } else if (!sId) {
            sId = null;
        }

        return {
            id: String(log.id || ('LOG-' + Math.floor(100000 + Math.random() * 900000))),
            student_id: sId,
            student_name: String(log.student_name || log.child_name || 'Student'),
            date: String(log.date || new Date().toISOString().split('T')[0]),
            status: String(log.status || 'PRESENT').toUpperCase(),
            marked_by: String(log.marked_by || log.admin || 'Admin'),
            notes: String(log.notes || ''),
            created_at: log.created_at || new Date().toISOString()
        };
    }

    let realtimeChannel = null;

    function initSupabase() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: { persistSession: false },
                    realtime: { heartbeatIntervalMs: 2500 }
                });
                console.log("⚡ Supabase Realtime Engine Connected!");
                subscribeRealtimeEvents();
                fetchInitialCloudData();
                setupMobileLivenessPolling();
                return true;
            } catch (err) {
                console.warn("Supabase init warning:", err);
                return false;
            }
        } else {
            console.log("Supabase JS SDK loading... retrying in 250ms");
            setTimeout(initSupabase, 250);
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
        try {
            if (realtimeChannel) {
                supabaseClient.removeChannel(realtimeChannel);
            }
        } catch(e){}

        realtimeChannel = supabaseClient
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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs' },
                (payload) => {
                    console.log("🔄 Realtime Attendance Log Update received:", payload);
                    if (typeof window.onRealtimeAttendanceLogUpdate === 'function') {
                        window.onRealtimeAttendanceLogUpdate(payload);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Supabase Realtime Channel Status:", status);
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setTimeout(() => {
                        subscribeRealtimeEvents();
                        fetchInitialCloudData();
                    }, 2000);
                }
            });
    }

    function setupMobileLivenessPolling() {
        // High-frequency REST poll every 3 seconds to guarantee instant multi-device mobile sync
        setInterval(() => {
            fetchInitialCloudData();
        }, 3000);

        // Instant re-fetch & re-subscribe when user unlocks phone or switches back to tab
        window.addEventListener('focus', () => {
            fetchInitialCloudData();
            subscribeRealtimeEvents();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                fetchInitialCloudData();
                subscribeRealtimeEvents();
            }
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

        async saveAttendanceLog(logData) {
            if (!supabaseClient) return null;
            const cleaned = cleanAttendanceLogPayload(logData);
            if (!cleaned) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('attendance_logs')
                    .upsert(cleaned, { onConflict: 'id' })
                    .select();
                if (error) {
                    console.error("Error saving attendance log to Supabase:", error);
                    if (error.code === '23503' && cleaned.student_id) {
                        console.warn("Retrying attendance log save with student_id=null due to FK constraint...");
                        cleaned.student_id = null;
                        const retryRes = await supabaseClient
                            .from('attendance_logs')
                            .upsert(cleaned, { onConflict: 'id' })
                            .select();
                        if (retryRes.error) console.error("Retry failed:", retryRes.error);
                        else console.log("⚡ Attendance log saved with student_id=null:", cleaned.student_name, cleaned.status);
                        return retryRes.data;
                    }
                } else {
                    console.log("⚡ Attendance log saved to Supabase:", cleaned.student_name, cleaned.status);
                }
                return data;
            } catch(e) { console.error("Supabase attendance log save error:", e); return null; }
        },

        async deleteAttendanceLog(logId) {
            if (!supabaseClient || !logId) return null;
            try {
                const { data, error } = await supabaseClient
                    .from('attendance_logs')
                    .delete()
                    .eq('id', String(logId));
                if (error) console.error("Error deleting attendance log from Supabase:", error);
                return data;
            } catch(e) { console.error("Supabase attendance log delete error:", e); return null; }
        },

        async fetchAllData() {
            if (!supabaseClient) return null;
            try {
                const [stdRes, parRes, resRes, payRes, logRes] = await Promise.all([
                    supabaseClient.from('students').select('*'),
                    supabaseClient.from('parents').select('*'),
                    supabaseClient.from('reschedules').select('*'),
                    supabaseClient.from('payment_transactions').select('*'),
                    supabaseClient.from('attendance_logs').select('*')
                ]);
                return {
                    students: stdRes.data || [],
                    parents: parRes.data || [],
                    reschedules: resRes.data || [],
                    payments: payRes.data || [],
                    attendance_logs: logRes.data || []
                };
            } catch(e) { console.error("Supabase fetch error:", e); return null; }
        },

        async purgeAllCloudData() {
            if (!supabaseClient) return false;
            try {
                await Promise.all([
                    supabaseClient.from('students').delete().neq('id', '___PURGE_ALL___'),
                    supabaseClient.from('parents').delete().neq('id', '___PURGE_ALL___'),
                    supabaseClient.from('reschedules').delete().neq('id', '___PURGE_ALL___'),
                    supabaseClient.from('payment_transactions').delete().neq('id', '___PURGE_ALL___'),
                    supabaseClient.from('attendance_logs').delete().neq('id', '___PURGE_ALL___')
                ]);
                console.log("🔥 All cloud records purged from Supabase.");
                return true;
            } catch(e) { console.error("Supabase purge error:", e); return false; }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
})();
