const CallLog = require('../models/CallLog');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getActivities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filter = req.query.filter || 'all'; // 'all', 'call', 'lead', 'system'
        const dateFilter = req.query.dateFilter || 'all'; // 'today', 'week', 'month', 'all'

        let startDate = new Date(0); // Beginning of time
        const now = new Date();

        if (dateFilter === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === 'week') {
            const firstDay = now.getDate() - now.getDay();
            startDate = new Date(now.setDate(firstDay));
            startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Fetch System Activities from Activity collection
        let systemQuery = { createdAt: { $gte: startDate }, type: 'system' };
        if (filter !== 'all' && filter !== 'system') {
            systemQuery = { _id: null }; // No results if filter doesn't match
        }

        // Fetch Calls
        let callQuery = { createdAt: { $gte: startDate } };
        if (filter !== 'all' && filter !== 'call') {
            callQuery = { _id: null }; // No results if filter doesn't match
        }

        // Fetch Leads
        let leadQuery = { createdAt: { $gte: startDate } };
        if (filter !== 'all' && filter !== 'lead') {
            leadQuery = { _id: null };
        }

        const [systemActivities, calls, leads] = await Promise.all([
            Activity.find(systemQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('user', 'name email'),
            CallLog.find(callQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('leadId', 'name'),
            Lead.find(leadQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
        ]);

        // Transform System Activities
        const formatSystemActivity = (activity) => ({
            id: activity._id,
            type: 'system',
            user: activity.user?.name || 'System',
            action: activity.action,
            target: '',
            time: activity.createdAt,
            details: activity.details || '',
            icon: 'ri-settings-3-line',
            color: 'purple',
            rawData: activity
        });

        // Transform Calls
        const formatCall = (call) => ({
            id: call._id,
            type: 'call',
            user: call.caller || 'System',
            action: 'completed call with',
            target: call.leadName || 'Unknown',
            time: call.createdAt,
            details: `Duration: ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`,
            icon: 'ri-phone-line',
            color: 'blue'
        });

        // Transform Leads
        const formatLead = (lead) => ({
            id: lead._id,
            type: 'lead',
            user: 'System',
            action: 'New lead',
            target: lead.name,
            time: lead.createdAt,
            details: `Source: ${lead.source}`,
            icon: 'ri-user-add-line',
            color: 'green'
        });

        const allActivities = [
            ...systemActivities.map(formatSystemActivity),
            ...calls.map(formatCall),
            ...leads.map(formatLead)
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        // Pagination (Simple slice for merged results)
        const paginatedActivities = allActivities.slice(0, limit);

        res.json({
            activities: paginatedActivities,
            hasMore: allActivities.length > limit
        });

    } catch (err) {
        console.error('Get Activities Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
