import { useState, useEffect } from 'react';
import {
    Button,
    Card,
    ConfigProvider,
    Form,
    Input,
    List,
    Modal,
    Popconfirm,
    Space,
    Tag,
    Typography,
    message
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import Aside from '../components/Aside.jsx';

const { Text } = Typography;
const API = 'http://127.0.0.1:8039/api/users';

export default function Users({ userRole }) {
    const [users, setUsers]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [isCreateVisible, setCreate]  = useState(false);
    const [form]                        = Form.useForm();

    /* ------ загрузка списка ------ */
    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(API, { withCredentials: true });
            setUsers(data);
        } catch (e) {
            console.error(e);
            message.error('Не удалось загрузить пользователей');
        } finally {
            setLoading(false);
        }
    };

    /* ------ создание ------ */
    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            await axios.post(API, values, { withCredentials: true });
            message.success('Пользователь создан');
            setCreate(false);
            form.resetFields();
            load();
        } catch (e) {
            message.error(e.response?.data?.detail || 'Ошибка создания пользователя');
        }
    };

    /* ------ удаление ------ */
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API}/${id}`, { withCredentials: true });
            message.success('Пользователь удалён');
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (e) {
            message.error('Не удалось удалить пользователя');
        }
    };

    /* ----- UI ----- */
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#8A2BE2',
                    colorTextPlaceholder: '#777'
                },
                components: {
                    Menu:   { darkItemSelectedBg: 'rgb(103,40,156)' },
                    Button: { defaultHoverBg: '#f6e6ff', defaultHoverColor: '#8A2BE2' },
                    Card:   { borderRadiusLG: 12 }
                }
            }}
        >
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
                <Aside userRole={userRole} />

                <div style={{ marginLeft: 350, padding: 24, flex: 1 }}>
                    <Card
                        loading={loading}
                        title={
                            <Space>
                                <Text strong style={{ fontSize: 18 }}>Управление пользователями</Text>
                                <Tag color="purple">{users.length}</Tag>
                            </Space>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setCreate(true)}
                            >
                                Добавить
                            </Button>
                        }
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,.1)', borderRadius: 12 }}
                    >
                        <List
                            dataSource={users}
                            renderItem={(u) => (
                                <List.Item
                                    key={u.id}
                                    style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
                                    extra={
                                        <Popconfirm
                                            title="Удалить пользователя?"
                                            onConfirm={() => handleDelete(u.id)}
                                            okText="Да"
                                            cancelText="Нет"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    }
                                >
                                    <List.Item.Meta
                                        title={<Text strong>{u.name}</Text>}
                                        description={
                                            <>
                                                <Text type="secondary">Логин: {u.login}</Text><br />
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    Создан: {dayjs(u.created_at).format('DD.MM.YYYY')}
                                                </Text>
                                            </>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* ---- модалка создания ---- */}
                    <Modal
                        title="Создание пользователя"
                        open={isCreateVisible}
                        onOk={handleCreate}
                        onCancel={() => { form.resetFields(); setCreate(false); }}
                        okText="Создать"
                        cancelText="Отмена"
                        confirmLoading={loading}
                        width={500}
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="login"
                                label="Логин"
                                rules={[
                                    { required: true, message: 'Введите логин' },
                                    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20 символов: буквы, цифры, _' }
                                ]}
                            >
                                <Input placeholder="ivanov" />
                            </Form.Item>

                            <Form.Item
                                name="name"
                                label="Имя"
                                rules={[{ required: true, message: 'Введите имя' }, { max: 100 }]}
                            >
                                <Input placeholder="Иван Иванов" />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Пароль"
                                rules={[{ required: true, message: 'Введите пароль' }, { min: 6 }]}
                            >
                                <Input.Password placeholder="не менее 6 символов" />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </div>
        </ConfigProvider>
    );
}
