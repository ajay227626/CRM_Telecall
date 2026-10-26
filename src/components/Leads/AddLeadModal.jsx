import React, { useState } from 'react';
import { createLead, updateLead, getUsers } from '../../utils/api';
import useEscapeKey from '../../hooks/useEscapeKey';

const AddLeadModal = ({ lead, onClose, onSave }) => {
    useEscapeKey(onClose);
    const [formData, setFormData] = useState(lead || {
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        category: 'Real Estate',
        source: 'Website',
        status: 'New',
        assignedTo: '',
        followUpDate: '',
        notes: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const categories = ['Hot', 'Cold', 'Real Estate', 'Construction', 'Insurance', 'Education', 'Other'];
    const sources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'];
    const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Lost'];
    const assignees = ['Mike Caller', 'Sarah Manager', 'Lisa Viewer', 'John Admin'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            if (lead) {
                await updateLead(lead._id, formData);
            } else {
                await createLead(formData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save lead');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '550px' }}>
                <div className="modal-header">
                    <h3>{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
                    <button onClick={onClose} className="modal-close">
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>

                {error && (
                    <div className="error-banner">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    placeholder="+1-555-0123"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>WhatsApp Number</label>
                                <input
                                    type="tel"
                                    placeholder="+1-555-0123"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {statuses.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row-3">
                            <div className="form-group">
                                <label>Lead Source</label>
                                <select
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                >
                                    {sources.map(src => (
                                        <option key={src} value={src}>{src}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {assignees.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Follow-up Date</label>
                            <input
                                type="date"
                                value={formData.followUpDate ? formData.followUpDate.split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                placeholder="Add any additional notes about this lead..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <i className="ri-loader-4-line spin" style={{ fontSize: '16px' }}></i> : <i className="ri-save-line" style={{ fontSize: '16px' }}></i>}
                            <span style={{ marginLeft: '0.5rem' }}>{lead ? 'Update Lead' : 'Save Lead'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
