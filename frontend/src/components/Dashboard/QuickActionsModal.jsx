import React from 'react';
import { useNavigate } from 'react-router-dom';
import useEscapeKey from '../../hooks/useEscapeKey';

const QuickActionsModal = ({ onClose, onAction }) => {
    useEscapeKey(onClose);
    const navigate = useNavigate();

    const actions = [
        {
            id: 'add-lead',
            title: 'Add New Lead',
            description: 'Quickly add a new lead to the system',
            icon: <i className="ri-user-add-line" style={{ fontSize: '24px' }}></i>,
            color: '#059669',
            link: '#'
        },
        {
            id: 'make-call',
            title: 'Make a Call',
            description: 'Start calling leads from your list',
            icon: <i className="ri-phone-line" style={{ fontSize: '24px' }}></i>,
            color: '#2563EB',
            link: '#'
        },
        {
            id: 'view-tasks',
            title: 'View Tasks',
            description: 'Check your pending tasks for today',
            icon: <i className="ri-task-line" style={{ fontSize: '24px' }}></i>,
            color: '#7C3AED',
            link: '#'
        },
        {
            id: 'generate-report',
            title: 'Generate Report',
            description: 'Create performance and analytics reports',
            icon: <i className="ri-bar-chart-2-line" style={{ fontSize: '24px' }}></i>,
            color: '#D97706',
            link: '#'
        }
    ];

    const handleActionClick = (action) => {
        if (onAction) {
            onAction(action.id);
        } else {
            onClose();
            navigate(action.link);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal quick-actions-modal">
                <div className="modal-header">
                    <h3>Quick Actions</h3>
                    <button className="modal-close" onClick={onClose}><i className="ri-close-line" style={{ fontSize: '20px' }}></i></button>
                </div>
                <div className="modal-body">
                    <div className="actions-grid">
                        {actions.map((action) => (
                            <div
                                key={action.id}
                                className="action-card"
                                onClick={() => handleActionClick(action)}
                            >
                                <div className="action-icon" style={{ color: action.color, backgroundColor: `${action.color}15` }}>
                                    {action.icon}
                                </div>
                                <div className="action-info">
                                    <h4>{action.title}</h4>
                                    <p>{action.description}</p>
                                </div>
                                <i className="ri-arrow-right-line action-arrow" style={{ fontSize: '18px' }}></i>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActionsModal;
