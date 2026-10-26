import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import useEscapeKey from '../../hooks/useEscapeKey';

const TaskModal = ({ onClose }) => {
    useEscapeKey(onClose);

    const [tasks, setTasks] = useState([
        { id: 1, title: 'Call back potential VIP clients', completed: false, priority: 'high', dueTime: '10:00 AM' },
        { id: 2, title: 'Update lead status for November campaign', completed: true, priority: 'medium', dueTime: '11:30 AM' },
        { id: 3, title: 'Prepare weekly performance report', completed: false, priority: 'high', dueTime: '2:00 PM' },
        { id: 4, title: 'Follow up with John regarding proposal', completed: false, priority: 'low', dueTime: '3:30 PM' },
        { id: 5, title: 'Team meeting - Q4 Strategy', completed: false, priority: 'medium', dueTime: '4:00 PM' },
    ]);

    const [newTask, setNewTask] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, {
                id: Date.now(),
                title: newTask,
                completed: false,
                priority: newTaskPriority,
                dueTime: 'Today'
            }]);
            setNewTask('');
            setNewTaskPriority('medium');
        }
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const modalContent = (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div className="modal task-modal" style={{
                width: '600px',
                maxHeight: '85vh',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header with Brand Color */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-task-line" style={{ fontSize: '22px', color: 'white' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>Today's Tasks</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                                {tasks.filter(t => !t.completed).length} pending, {tasks.filter(t => t.completed).length} completed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>

                {/* Add New Task Section */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'var(--primary-light, #f0fdf4)',
                    borderBottom: '1px solid var(--border, #e5e7eb)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexWrap: 'nowrap'
                    }}>
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="What do you need to do?"
                            style={{
                                flex: '1 1 auto',
                                minWidth: '200px',
                                padding: '0.875rem 1rem',
                                border: '2px solid var(--border, #e5e7eb)',
                                borderRadius: '0.625rem',
                                fontSize: '0.9375rem',
                                background: 'white',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                width: '100%'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border, #e5e7eb)'}
                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        />
                        <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value)}
                            style={{
                                flex: '0 0 auto',
                                padding: '0.875rem 1rem',
                                border: '2px solid var(--border, #e5e7eb)',
                                borderRadius: '0.625rem',
                                fontSize: '0.875rem',
                                background: 'white',
                                cursor: 'pointer',
                                width: '120px',
                                minWidth: '120px'
                            }}
                        >
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                        <button
                            onClick={addTask}
                            style={{
                                flex: '0 0 auto',
                                padding: '0.875rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.625rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '600',
                                fontSize: '0.9375rem',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <i className="ri-add-line"></i> Add
                        </button>
                    </div>
                </div>

                {/* Task List */}
                <div style={{
                    padding: '1rem 1.5rem',
                    maxHeight: '45vh',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    background: task.completed ? 'var(--bg-hover)' : 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.75rem',
                                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                                    transition: 'all 0.2s',
                                    opacity: task.completed ? 0.7 : 1
                                }}
                            >
                                <div
                                    onClick={() => toggleTask(task.id)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        border: task.completed ? 'none' : '2px solid var(--border)',
                                        background: task.completed ? 'var(--primary)' : 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    {task.completed && <i className="ri-check-line" style={{ color: 'white', fontSize: '14px' }}></i>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.9375rem',
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        color: task.completed ? 'var(--text-secondary)' : 'var(--text-main)',
                                        fontWeight: '500'
                                    }}>
                                        {task.title}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <i className="ri-time-line"></i>
                                        {task.dueTime}
                                    </span>
                                </div>
                                <span style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.6875rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    background: `${getPriorityColor(task.priority)}15`,
                                    color: getPriorityColor(task.priority)
                                }}>
                                    {task.priority}
                                </span>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{
                                        padding: '0.5rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#D1D5DB',
                                        borderRadius: '0.375rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#EF4444';
                                        e.currentTarget.style.background = '#FEE2E2';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#D1D5DB';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <i className="ri-delete-bin-line" style={{ fontSize: '18px' }}></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-main)'
                }}>
                    <span style={{ fontSize: '0.875rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ri-checkbox-circle-fill" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
                        {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default TaskModal;
