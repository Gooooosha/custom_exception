import {useEffect, useState} from 'react';
import {
    Button,
    Card,
    ConfigProvider,
    Divider,
    Form,
    Input,
    List,
    message,
    Modal,
    Select,
    Spin,
    Tag,
    Typography
} from 'antd';
import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import axios from 'axios';
import Aside from '../components/Aside';

const {Option} = Select;
const {Text} = Typography;

const notificationTypes = [
    {value: 'webhook', label: 'Webhook'},
    {value: 'mattermost', label: 'Mattermost'},
    {value: 'slack', label: 'Slack'}
];

const Notifications = ({userRole}) => {
    const [form] = Form.useForm();
    const [notifications, setNotifications] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState('webhook');
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        fetchNotifications();
        fetchProjects();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8039/api/notifications', {
                withCredentials: true
            });
            setNotifications(response.data);
        } catch (error) {
            messageApi.error('Ошибка при загрузке уведомлений');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8039/api/projects', {
                withCredentials: true
            });
            setProjects(response.data);
        } catch (error) {
            messageApi.error('Ошибка при загрузке проектов');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const notificationData = {
                project_uuid: values.project_uuid,
                title: values.title,
                description: values.description || null,
                type: values.type,
                url: values.url,
                channel: values.channel || null,
                username: values.username || null
            };

            await axios.post('http://127.0.0.1:8039/api/notifications', notificationData, {
                withCredentials: true,
                timeout: 5000
            });

            messageApi.success('Уведомление успешно добавлено');
            handleModalClose();
            fetchNotifications();
        } catch (error) {
            messageApi.error('Ошибка при добавлении уведомления');
            console.error('Error adding notification:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8039/api/notifications/${id}`, {
                withCredentials: true
            });
            messageApi.success('Уведомление удалено');
            fetchNotifications();
        } catch (error) {
            messageApi.error('Ошибка при удалении уведомления');
        }
    };

    const handleModalClose = () => {
        form.resetFields();
        setSelectedType('webhook');
        setIsModalVisible(false);
    };

    const renderTypeSpecificFields = () => {
        switch (selectedType) {
            case 'webhook':
                return (
                    <Form.Item
                        label="URL webhook"
                        name="url"
                        rules={[{required: true, message: 'Введите URL webhook'}]}
                    >
                        <Input
                            style={{height: '45px', borderRadius: '8px'}}
                            placeholder="https://example.com/webhook"
                        />
                    </Form.Item>
                );
            case 'mattermost':
                return (
                    <>
                        <Form.Item
                            label="URL Mattermost"
                            name="url"
                            rules={[{required: true, message: 'Введите URL Mattermost'}]}
                        >
                            <Input
                                style={{height: '45px', borderRadius: '8px'}}
                                placeholder="https://mattermost.example.com"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Канал"
                            name="channel"
                            rules={[{required: true, message: 'Введите канал'}]}
                        >
                            <Input
                                style={{height: '45px', borderRadius: '8px'}}
                                placeholder="general"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Имя пользователя"
                            name="username"
                            rules={[{required: true, message: 'Введите имя пользователя'}]}
                        >
                            <Input
                                style={{height: '45px', borderRadius: '8px'}}
                                placeholder="bot"
                            />
                        </Form.Item>
                    </>
                );
            case 'slack':
                return (
                    <Form.Item
                        label="Webhook URL Slack"
                        name="url"
                        rules={[{required: true, message: 'Введите Webhook URL Slack'}]}
                    >
                        <Input
                            style={{height: '45px', borderRadius: '8px'}}
                            placeholder="https://hooks.slack.com/services/..."
                        />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    const getTypeLabel = (type) => {
        const found = notificationTypes.find(t => t.value === type);
        return found ? found.label : type;
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#8A2BE2',
                    colorTextPlaceholder: '#777777',
                },
                components: {
                    Menu: {
                        darkItemSelectedBg: 'rgb(103,40,156)',
                    },
                    Button: {
                        defaultHoverBg: '#f6e6ff',
                        defaultHoverColor: '#8A2BE2',
                        defaultHoverBorderColor: '#8A2BE2',
                    },
                    Card: {
                        borderRadiusLG: 12,
                    },
                },
            }}
        >
            {contextHolder}
            <div style={{display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
                <Aside userRole={userRole}/>
                <div style={{marginLeft: 350, padding: 24, width: '100%'}}>
                    <Card
                        title={
                            <span style={{
                                fontSize: '1.5rem',
                                color: '#2c3959',
                                fontWeight: 'bold'
                            }}>
                                Уведомления
                            </span>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined/>}
                                onClick={() => setIsModalVisible(true)}
                                style={{
                                    backgroundColor: '#8A2BE2',
                                    borderRadius: '8px',
                                    height: '40px'
                                }}
                                disabled={!['admin', 'project_manager'].includes(userRole)}
                            >
                                Добавить уведомление
                            </Button>
                        }
                        bordered={false}
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px'
                        }}
                    >
                        {loading ? (
                            <div style={{padding: 24, textAlign: 'center'}}>
                                <Spin tip="Загрузка данных..." size="large"/>
                            </div>
                        ) : (
                            <List
                                dataSource={notifications}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                danger
                                                icon={<DeleteOutlined/>}
                                                onClick={() => handleDelete(item.id)}
                                                style={{borderRadius: '8px'}}
                                                disabled={!['admin', 'project_manager'].includes(userRole)}
                                            />
                                        ]}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            backgroundColor: '#ffffff',
                                            transition: 'all 0.3s',
                                            ':hover': {
                                                boxShadow: '0 2px 8px rgba(138, 43, 226, 0.2)'
                                            }
                                        }}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <div style={{display: 'flex', alignItems: 'center'}}>
                                                    <Text strong style={{fontSize: '1.1rem'}}>{item.title}</Text>
                                                    <Tag
                                                        color="blue"
                                                        style={{
                                                            marginLeft: 8,
                                                            backgroundColor: '#8A2BE2',
                                                            color: '#fff',
                                                            borderRadius: '4px',
                                                            borderWidth: '0px'
                                                        }}
                                                    >
                                                        {getTypeLabel(item.type)}
                                                    </Tag>
                                                </div>
                                            }
                                            description={
                                                <Text type="secondary" style={{fontSize: '0.9rem'}}>
                                                    {item.description || 'Без описания'}
                                                </Text>
                                            }
                                        />
                                        <div>
                                            {item.project && (
                                                <Tag style={{marginRight: 8}}>Проект: {item.project.title}</Tag>
                                            )}
                                            {item.url && <Text code>{item.url}</Text>}
                                            {item.type === 'mattermost' && item.channel && (
                                                <Text style={{marginLeft: 8}}>/ {item.channel}</Text>
                                            )}
                                            {item.type === 'mattermost' && item.username && (
                                                <Text style={{marginLeft: 8}}>/ {item.username}</Text>
                                            )}
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>

                    <Modal
                        open={isModalVisible}
                        onCancel={handleModalClose}
                        footer={null}
                        width={600}
                        centered
                        bodyStyle={{padding: '24px'}}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{type: 'webhook'}}
                        >
                            <h1 style={{
                                fontSize: '2rem',
                                color: '#2c3959',
                                fontWeight: 'bold',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>Добавить новое уведомление</h1>

                            <Form.Item
                                label={<span style={{fontWeight: '500'}}>Проект</span>}
                                name="project_uuid"
                                rules={[{required: true, message: 'Пожалуйста, выберите проект'}]}
                            >
                                <Select
                                    placeholder="Выберите проект"
                                    style={{height: '45px', borderRadius: '8px'}}
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {projects.map(project => (
                                        <Option key={project.uuid} value={project.uuid}>
                                            {project.title}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label={<span style={{fontWeight: '500'}}>Название</span>}
                                name="title"
                                rules={[{required: true, message: 'Введите название уведомления'}]}
                            >
                                <Input
                                    placeholder="Мое уведомление"
                                    style={{height: '45px', borderRadius: '8px'}}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{fontWeight: '500'}}>Описание</span>}
                                name="description"
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Описание уведомления (необязательно)"
                                    style={{borderRadius: '8px'}}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{fontWeight: '500'}}>Тип уведомления</span>}
                                name="type"
                                rules={[{required: true, message: 'Выберите тип уведомления'}]}
                            >
                                <Select
                                    onChange={(value) => setSelectedType(value)}
                                    style={{height: '45px', borderRadius: '8px'}}
                                >
                                    {notificationTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            {renderTypeSpecificFields()}

                            <Divider/>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{
                                        width: '100%',
                                        height: '45px',
                                        borderRadius: '8px',
                                        backgroundColor: '#8A2BE2',
                                        fontSize: '1rem'
                                    }}
                                >
                                    Сохранить
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default Notifications;