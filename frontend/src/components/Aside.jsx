import {ConfigProvider, Menu, Modal} from 'antd';
import {useLocation, useNavigate} from "react-router-dom";
import {
    BugOutlined,
    DashboardOutlined,
    ImportOutlined,
    LogoutOutlined,
    ProjectOutlined,
    SendOutlined,
    TeamOutlined
} from "@ant-design/icons";
import axios from "axios";
import {useState} from "react";

const Aside = ({ userRole }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const baseItems = [
        {
            key: 'issues',
            icon: <BugOutlined/>,
            label: 'Ошибки',
            roles: ['admin', 'project_manager', 'user']
        },
        {
            key: 'notifications',
            icon: <SendOutlined/>,
            label: 'Уведомления',
            roles: ['admin', 'project_manager']
        },
        {
            key: 'projects',
            icon: <ProjectOutlined/>,
            label: 'Проекты',
            roles: ['admin', 'project_manager']
        },
        {
            key: 'dashboard',
            icon: <DashboardOutlined/>,
            label: 'Аналитика',
            roles: ['admin', 'project_manager', 'user']
        },
        {
            key: 'data',
            icon: <ImportOutlined/>,
            label: 'Экспорт/Импорт',
            roles: ['admin', 'project_manager', 'user']
        },
        {
            key: 'users',
            icon: <TeamOutlined/>,
            label: 'Пользователи',
            roles: ['admin']
        },
        {
            key: 'logout',
            icon: <LogoutOutlined/>,
            label: 'Выход',
            danger: true,
            style: {marginTop: 'auto', marginBottom: 20},
            roles: ['admin', 'project_manager', 'user']
        },
    ];

    const items = baseItems.filter(item =>
        !item.roles || item.roles.includes(userRole)
    );

    const onClick = async (e) => {
        switch (e.key) {
            case 'issues':
                navigate('/issues');
                break;
            case 'notifications':
                navigate('/notifications');
                break;
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'projects':
                navigate('/projects');
                break;
            case 'users':
                navigate('/users');
                break;
            case 'data':
                navigate('/datatransfer');
                break;
            case 'logout':
                setIsLogoutModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://127.0.0.1:8039/api/auth/logout', {}, {
                withCredentials: true
            });
            navigate('/');
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            setIsLogoutModalOpen(false);
        }
    };

    const selectedKey = location.pathname === '/dashboard' ? 'dashboard' :
        location.pathname === '/issues' ? 'issues' :
            location.pathname === '/projects' ? 'projects' :
                location.pathname === '/users' ? 'users' :
                    location.pathname === '/datatransfer' ? 'data' :
                        location.pathname === '/notifications' ? 'notifications' : '';

    return (
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
            <ConfigProvider
                theme={{
                    components: {
                        Menu: {
                            darkItemSelectedBg: 'rgb(103,40,156)',
                        },
                    },
                }}
            >
                <Menu
                    selectedKeys={[selectedKey]}
                    mode="vertical"
                    theme="dark"
                    items={items}
                    onClick={onClick}
                    style={{
                        height: '100%',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '350px',
                    }}
                />
            </ConfigProvider>

            <Modal
                title="Подтверждение выхода"
                open={isLogoutModalOpen}
                onOk={handleLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
                okText="Выйти"
                cancelText="Отмена"
            >
                <p>Вы уверены, что хотите выйти из системы?</p>
            </Modal>
        </div>
    );
};

export default Aside;