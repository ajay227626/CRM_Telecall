const CallLog = require('../models/CallLog');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.getCallLogs = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { leadName: { $regex: search, $options: 'i' } },
                { caller: { $regex: search, $options: 'i' } },
                { leadPhone: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [callLogs, total] = await Promise.all([
            CallLog.find(query)
                .sort({ callTime: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            CallLog.countDocuments(query)
        ]);

        res.json({
            callLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCallStats = async (req, res) => {
    try {
        const stats = await CallLog.aggregate([
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    completedCalls: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    totalDuration: { $sum: '$duration' },
                    avgScore: { $avg: '$aiScore' }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                totalCalls: 0,
                completedCalls: 0,
                avgDuration: '0:00',
                avgScore: 0
            });
        }

        const s = stats[0];
        const avgDurationSec = s.totalCalls > 0 ? Math.round(s.totalDuration / s.totalCalls) : 0;
        const minutes = Math.floor(avgDurationSec / 60);
        const seconds = avgDurationSec % 60;

        res.json({
            totalCalls: s.totalCalls,
            completedCalls: s.completedCalls,
            avgDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            avgScore: s.avgScore ? s.avgScore.toFixed(1) : 'N/A'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCallLog = async (req, res) => {
    try {
        const callLog = new CallLog(req.body);
        await callLog.save();
        res.status(201).json(callLog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateCallLog = async (req, res) => {
    try {
        const callLog = await CallLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!callLog) return res.status(404).json({ error: 'Call log not found' });
        res.json(callLog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteCallLog = async (req, res) => {
    try {
        await CallLog.findByIdAndDelete(req.params.id);

        if (req.user) {
            await Activity.create({
                user: req.user._id,
                action: 'Deleted Call Log',
                details: `Deleted call log ${req.params.id}`,
                type: 'system',
                onModel: 'CallLog'
            });
        }
        res.json({ message: 'Call log deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Simulate initiating a call (in production this would integrate with Twilio)
exports.initiateCall = async (req, res) => {
    try {
        const { leadId, callType } = req.body;
        const lead = await Lead.findById(leadId);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Simulate a call completion with AI analysis
        const transcription = "Hello, this is John. I'm calling to inquire about your CRM services. I saw your post on LinkedIn and I'm interested in a demo. Our team is looking for a solution to manage our 500+ daily leads. Looking forward to hearing from you.";

        let aiSummary = "Interested in CRM demo.";
        let aiScore = 8;

        // Use Gemini for real analysis if API key is present
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
            try {
                const prompt = `Analyze this call transcription: "${transcription}". Provide a 1-sentence summary and a lead quality score (0-10) based on interest. Format your response exactly like this: Summary: [summary] | Score: [score]`;
                const result = await model.generateContent(prompt);
                const response = result.response.text();

                const summaryMatch = response.match(/Summary: (.*?) \|/);
                const scoreMatch = response.match(/Score: (\d+)/);

                if (summaryMatch) aiSummary = summaryMatch[1];
                if (scoreMatch) aiScore = parseInt(scoreMatch[1]);
            } catch (aiErr) {
                console.error("AI Analysis Error:", aiErr);
            }
        }

        const callLog = new CallLog({
            leadId: lead._id,
            leadName: lead.name,
            leadPhone: lead.phone,
            callType: callType || 'Masked',
            caller: 'Admin User',
            duration: Math.floor(Math.random() * 180) + 30,
            status: 'completed',
            aiScore: aiScore,
            aiSummary: aiSummary,
            transcription: transcription,
            notes: 'Follow up requested for demo.'
        });

        await callLog.save();
        res.status(201).json(callLog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
