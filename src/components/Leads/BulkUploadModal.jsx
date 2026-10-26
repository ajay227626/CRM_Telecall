import React, { useState, useRef } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { bulkCreateLeads } from '../../utils/api';

const BulkUploadModal = ({ onClose, onSuccess }) => {
    useEscapeKey(onClose);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setError('');
        } else {
            setError('Please upload a CSV, XLS, or XLSX file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            // Parse CSV file (simplified - in production use a proper CSV parser)
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const leads = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const lead = {};
                headers.forEach((header, idx) => {
                    if (header === 'name' || header === 'full name') lead.name = values[idx];
                    if (header === 'phone' || header === 'phone number') lead.phone = values[idx];
                    if (header === 'email') lead.email = values[idx];
                    if (header === 'whatsapp') lead.whatsapp = values[idx];
                    if (header === 'category') lead.category = values[idx] || 'Other';
                    if (header === 'source') lead.source = values[idx] || 'Other';
                    if (header === 'assigned to' || header === 'assignedto') lead.assignedTo = values[idx];
                });
                if (lead.name && lead.phone && lead.email) {
                    leads.push(lead);
                }
            }

            if (leads.length === 0) {
                throw new Error('No valid leads found in file. Ensure columns: name, phone, email');
            }

            const response = await bulkCreateLeads(leads);
            setResult(response);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to upload leads');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csv = 'name,phone,email,whatsapp,category,source,assigned to\nJohn Doe,+1-555-0123,john@example.com,+1-555-0123,Real Estate,Website,Mike Caller';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '500px' }}>
                <div className="modal-header">
                    <h3>Bulk Upload Leads</h3>
                    <button onClick={onClose} className="modal-close">
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Instructions */}
                    <div className="upload-instructions">
                        <h4 className="instructions-title">Upload Instructions</h4>
                        <ul>
                            <li>Download the template file and fill in your lead data</li>
                            <li>Supported formats: CSV, XLS, XLSX</li>
                            <li>Maximum file size: 10MB</li>
                            <li>Maximum 1000 leads per upload</li>
                        </ul>
                    </div>

                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                        <button className="btn btn-secondary" onClick={downloadTemplate}>
                            <i className="ri-download-line" style={{ fontSize: '16px', marginRight: '0.5rem' }}></i>
                            Download Template
                        </button>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div className="file-info">
                                <i className="ri-file-excel-line text-green" style={{ fontSize: '32px' }}></i>
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <>
                                <i className="ri-upload-cloud-line upload-icon" style={{ fontSize: '32px' }}></i>
                                <p className="drop-text">Drop your file here or click to browse</p>
                                <p className="drop-hint">CSV, XLS, XLSX files up to 10MB</p>
                            </>
                        )}
                    </div>

                    {error && <div className="error-banner">{error}</div>}

                    {result && (
                        <div className="success-banner">
                            <i className="ri-checkbox-circle-line" style={{ fontSize: '18px' }}></i>
                            <span>{result.message}</span>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? <i className="ri-loader-4-line spin" style={{ fontSize: '16px' }}></i> : <i className="ri-upload-cloud-line" style={{ fontSize: '16px' }}></i>}
                        <span style={{ marginLeft: '0.5rem' }}>Upload Leads</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;
