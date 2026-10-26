const Lead = require('../models/Lead');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));

        // Time ranges for trends
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        const endOfLastMonth = new Date(startOfLastMonth);
        endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
        endOfLastMonth.setDate(0); // Last day of previous month

        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);

        // Aggregations
        const [
            totalLeads,
            totalLeadsLastMonth,
            newLeadsToday,
            newLeadsYesterday,
            contactedToday,
            contactedYesterday,
            followupsDue,
            callsToday,
            callsYesterday,
            leadsByStatus,
            leadsByStatusLastWeek,
            callsLast7Days,
            notifications,
            recentCallsRaw,
            recentLeadsRaw,
            recentUsersRaw,
            recentSystemActivitiesRaw
        ] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ createdAt: { $lte: endOfLastMonth } }),
            Lead.countDocuments({ createdAt: { $gte: startOfToday } }),
            Lead.countDocuments({ createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }),
            Lead.countDocuments({ status: 'Contacted', updatedAt: { $gte: startOfToday } }),
            Lead.countDocuments({ status: 'Contacted', updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday } }),
            Lead.countDocuments({ followUpDate: { $lte: new Date(new Date().setHours(23, 59, 59, 999)) }, status: { $ne: 'Converted' } }),
            CallLog.countDocuments({ createdAt: { $gte: startOfToday } }),
            CallLog.countDocuments({ createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }),
            Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Lead.aggregate([
                { $match: { createdAt: { $lte: endOfLastWeek } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            CallLog.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Notification.find({ user: req.user.id, read: false }).sort({ createdAt: -1 }).limit(5),
            // Recent Activity Aggregation
            CallLog.find().sort({ createdAt: -1 }).limit(5).populate('leadId', 'name'),
            Lead.find().sort({ createdAt: -1 }).limit(5),
            User.find().sort({ createdAt: -1 }).limit(5),
            Activity.find().sort({ createdAt: -1 }).limit(5)
        ]);

        // Process Recent Activity
        const recentCalls = (recentCallsRaw || []).map(call => ({
            type: 'call',
            icon: 'ri-phone-fill',
            bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Blue
            user: call.caller || 'System',
            action: 'completed call with',
            target: call.leadName || 'Unknown Lead',
            time: call.createdAt,
            id: call._id,
            color: 'blue' // Fallback for modal
        }));

        const recentLeads = (recentLeadsRaw || []).map(lead => ({
            type: 'lead',
            icon: 'ri-user-add-fill',
            bg: 'linear-gradient(135deg, #10b981, #059669)', // Green
            user: 'System',
            action: 'added new lead',
            target: lead.name,
            time: lead.createdAt,
            id: lead._id,
            color: 'green'
        }));

        const recentUsers = (recentUsersRaw || []).map(user => ({
            type: 'user',
            icon: 'ri-user-smile-fill',
            bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Purple
            user: 'System',
            action: 'joined the team',
            target: user.name,
            time: user.createdAt,
            id: user._id,
            details: `Role: ${user.systemRole || 'User'}`,
            details: `Role: ${user.systemRole || 'User'}`,
            color: 'purple'
        }));

        const recentSystemActivities = (recentSystemActivitiesRaw || []).map(act => ({
            type: 'system',
            icon: 'ri-settings-3-fill',
            bg: 'linear-gradient(135deg, #64748b, #475569)',
            user: 'System',
            action: act.action,
            target: act.details || 'System Action',
            time: act.createdAt,
            id: act._id,
            color: 'gray'
        }));

        const recentActivity = [...recentCalls, ...recentLeads, ...recentUsers, ...recentSystemActivities]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);


        // Helper for percentage change
        const getPercentageChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const totalLeadsTrend = getPercentageChange(totalLeads, totalLeadsLastMonth);
        const newLeadsTrend = getPercentageChange(newLeadsToday, newLeadsYesterday);
        const contactedTrend = getPercentageChange(contactedToday, contactedYesterday);
        const callsTrend = getPercentageChange(callsToday, callsYesterday);

        const conversionRate = totalLeads > 0
            ? ((leadsByStatus.find(s => s._id === 'Converted')?.count || 0) / totalLeads * 100).toFixed(1)
            : 0;

        const totalLeadsLastWeek = leadsByStatusLastWeek.reduce((acc, curr) => acc + curr.count, 0);
        const conversionRateLastWeek = totalLeadsLastWeek > 0
            ? ((leadsByStatusLastWeek.find(s => s._id === 'Converted')?.count || 0) / totalLeadsLastWeek * 100).toFixed(1)
            : 0;

        const conversionRateTrend = (parseFloat(conversionRate) - parseFloat(conversionRateLastWeek)).toFixed(1);

        res.json({
            summary: {
                totalLeads,
                totalLeadsTrend,
                newLeadsToday,
                newLeadsTrend,
                contactedToday,
                contactedTrend,
                followupsDue,
                conversionRate: parseFloat(conversionRate),
                conversionRateTrend: parseFloat(conversionRateTrend),
                callsToday,
                callsTrend
            },
            statusDistribution: leadsByStatus,
            callTrends: callsLast7Days,
            notifications: notifications.map(n => ({
                id: n._id,
                type: n.type,
                title: n.title,
                message: n.message,
                createdAt: n.createdAt,
                read: n.read,
                severity: n.type,
            })),
            recentActivity
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetailedStats = async (req, res) => {
    const { category } = req.params;
    try {
        let data = {};
        switch (category) {
            case 'conversion':
                data = await Lead.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]);
                break;
            case 'calls':
                data = await CallLog.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]);
                break;
            default:
                data = await Lead.find().limit(10).sort({ createdAt: -1 });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getChartData = async (req, res) => {
    const { range, type, from, to } = req.query; // range: daily, weekly, monthly, yearly, custom
    try {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        let dateFormat = '%Y-%m-%d';
        let groupBy = {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
        };

        // Determine Match Range and Group Format
        switch (range) {
            case 'daily': // Last 30 days
                startDate.setDate(now.getDate() - 30);
                dateFormat = '%Y-%m-%d';
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'weekly': // Last 12 weeks
                startDate.setDate(now.getDate() - 84); // 12 * 7
                dateFormat = '%Y-W%V';
                groupBy = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
                break;
            case 'monthly': // Last 12 months
                startDate.setMonth(now.getMonth() - 12);
                dateFormat = '%Y-%m';
                groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
            case 'yearly': // Last 5 years
                startDate.setFullYear(now.getFullYear() - 5);
                dateFormat = '%Y';
                groupBy = { $dateToString: { format: "%Y", date: "$createdAt" } };
                break;
            case 'custom':
                if (from && to) {
                    startDate = new Date(from);
                    // Set end date to end of day
                    endDate = new Date(to);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    startDate.setDate(now.getDate() - 30);
                }
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            default:
                startDate.setDate(now.getDate() - 30);
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        }

        const Model = (type === 'calls') ? CallLog : Lead;

        const data = await Model.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
