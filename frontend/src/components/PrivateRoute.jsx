import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {Spin} from 'antd';

export default function PrivateRoute({children, allowedRoles}) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://127.0.0.1:8039/api/auth/me', {withCredentials: true})
            .then(response => {
                const role = response.data.role;
                setUserRole(role);

                if (!allowedRoles || allowedRoles.includes(role)) {
                    setAuthorized(true);
                } else {
                    navigate('/');
                }
                setLoading(false);
            })
            .catch(() => {
                navigate('/');
            });
    }, [allowedRoles, navigate]);

    if (loading) return <Spin size="large"/>;

    return authorized ? React.cloneElement(children, {
        userRole: userRole,
    }) : null;
}