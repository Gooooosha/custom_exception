import {useEffect, useState} from 'react';
import {
    Avatar,
    Button,
    Card,
    ConfigProvider,
    Divider,
    Form,
    Input,
    List,
    message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Tag,
    Typography
} from 'antd';
import {
    CopyOutlined,
    DeleteOutlined,
    LinkOutlined,
    PlusOutlined,
    SettingOutlined,
    UserAddOutlined,
    UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Aside from "../components/Aside.jsx";

const {Text} = Typography;
const {Option} = Select;

export default function Projects({userRole}) {
    const [projects, setProjects] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [form] = Form.useForm();
    const [membersForm] = Form.useForm();
    const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
    const [linkProject, setLinkProject] = useState(null);
    const [eventLink, setEventLink] = useState('');
    const [loadingLink, setLoadingLink] = useState(false);

    const fetchEventLink = async (projectUuid) => {
        setLoadingLink(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8039/api/project/${projectUuid}/link`, {
                withCredentials: true,
            });
            setEventLink(res.data.link);
        } catch (error) {
            message.error('Ошибка при получении ссылки');
            setEventLink('');
            console.error('Error fetching event link:', error);
        } finally {
            setLoadingLink(false);
        }
    };

    const showLinkModal = (project) => {
        setLinkProject(project);
        fetchEventLink(project.uuid);
        setIsLinkModalVisible(true);
    };

    const handleLinkModalCancel = () => {
        setIsLinkModalVisible(false);
        setEventLink('');
        setLinkProject(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, usersRes] = await Promise.all([
                    axios.get('http://127.0.0.1:8039/api/projects', {withCredentials: true}),
                    axios.get('http://127.0.0.1:8039/api/users', {withCredentials: true})
                ]);

                const projectsData = projectsRes.data;

                const projectsWithMembers = await Promise.all(
                    projectsData.map(async (project) => {
                        try {
                            const membersRes = await axios.get(
                                `http://127.0.0.1:8039/api/projects/${project.uuid}/members`,
                                {withCredentials: true}
                            );
                            return {
                                ...project,
                                users: Array.isArray(membersRes.data) ? membersRes.data : []
                            };
                        } catch (err) {
                            return {
                                ...project,
                                users: []
                            };
                        }
                    })
                );

                setProjects(projectsWithMembers);
                setAllUsers(usersRes.data);
            } catch (error) {
                message.error('Ошибка загрузки данных');
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateProject = async () => {
        try {
            const values = await form.validateFields();
            await axios.post('http://127.0.0.1:8039/api/projects', values, {
                withCredentials: true
            });

            const response = await axios.get('http://127.0.0.1:8039/api/projects', {
                withCredentials: true
            });

            setProjects(response.data.map(project => ({
                ...project,
                users: Array.isArray(project.users) ? project.users : []
            })));

            message.success('Проект успешно создан');
            form.resetFields();
            setIsCreateModalVisible(false);
        } catch (error) {
            message.error('Ошибка при создании проекта');
            console.error('Error creating project:', error);
        }
    };

    const handleDeleteProject = async (projectUuid) => {
        try {
            await axios.delete(`http://127.0.0.1:8039/api/projects/${projectUuid}`, {
                withCredentials: true
            });
            setProjects(projects.filter(p => p.uuid !== projectUuid));
            message.success('Проект удален');
        } catch (error) {
            message.error('Ошибка при удалении проекта');
            console.error('Error deleting project:', error);
        }
    };

    const showMembersModal = async (project) => {
        try {
            setCurrentProject({
                ...project,
                users: Array.isArray(project.users) ? project.users : []
            });

            const response = await axios.get(
                `http://127.0.0.1:8039/api/projects/${project.uuid}/members`,
                {withCredentials: true}
            );

            const normalizedMembers = Array.isArray(response.data) ? response.data : [];

            membersForm.setFieldsValue({
                members: normalizedMembers.map(user => user.id)
            });
            setIsMembersModalVisible(true);
        } catch (error) {
            message.error('Ошибка загрузки участников');
            console.error('Error loading members:', error);
        }
    };

    const handleUpdateMembers = async () => {
        try {
            const values = await membersForm.validateFields();
            const currentMembers = currentProject?.users?.map(u => u.id) || [];

            const membersToAdd = values.members.filter(id => !currentMembers.includes(id));
            const membersToRemove = currentMembers.filter(id => !values.members.includes(id));

            await Promise.all([
                ...membersToAdd.map(userId =>
                    axios.post(
                        `http://127.0.0.1:8039/api/projects/${currentProject.uuid}/members/${userId}`,
                        {},
                        {withCredentials: true}
                    )
                ),
                ...membersToRemove.map(userId =>
                    axios.delete(
                        `http://127.0.0.1:8039/api/projects/${currentProject.uuid}/members/${userId}`,
                        {withCredentials: true}
                    )
                )
            ]);

            const updatedResponse = await axios.get(
                `http://127.0.0.1:8039/api/projects/${currentProject.uuid}/members`,
                {withCredentials: true}
            );

            const updatedMembers = Array.isArray(updatedResponse.data) ? updatedResponse.data : [];

            setProjects(projects.map(p =>
                p.uuid === currentProject.uuid
                    ? {...p, users: updatedMembers}
                    : p
            ));

            setCurrentProject(prev => ({
                ...prev,
                users: updatedMembers
            }));

            message.success('Состав участников обновлен');
            setIsMembersModalVisible(false);
        } catch (error) {
            message.error('Ошибка при обновлении участников');
            console.error('Error updating members:', error);
        }
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
                    Select: {
                        optionSelectedBg: '#f6e6ff',
                        optionActiveBg: '#f6e6ff',
                    },
                },
            }}
        >
            <div style={{display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5'}}>
                <Aside userRole={userRole}/>
                <div style={{marginLeft: 350, padding: 24, width: '100%'}}>
                    <Card
                        title={
                            <Space>
                                <Text strong style={{fontSize: '1.2rem'}}>Управление проектами</Text>
                                <Tag color="purple">{projects.length} проектов</Tag>
                            </Space>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined/>}
                                onClick={() => setIsCreateModalVisible(true)}
                                disabled={!['admin', 'project_manager'].includes(userRole)}
                            >
                                Создать проект
                            </Button>
                        }
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            marginBottom: 24,
                        }}
                    >
                        {loading ? (
                            <div style={{padding: 24, textAlign: 'center'}}>
                                <Spin tip="Загрузка данных..." size="large"/>
                            </div>
                        ) : (
                            <List
                                itemLayout="vertical"
                                dataSource={projects}
                                renderItem={(project) => (
                                    <List.Item
                                        key={project.uuid}
                                        style={{
                                            padding: '16px 24px',
                                            borderBottom: '1px solid #f0f0f0',
                                            transition: 'all 0.3s',
                                            ':hover': {
                                                backgroundColor: '#fafafa',
                                            }
                                        }}
                                        extra={[
                                            <Space key="actions" size="middle">
                                                <Button
                                                    icon={<UserAddOutlined/>}
                                                    onClick={() => showMembersModal(project)}
                                                >
                                                    Участники ({project.users.length})
                                                </Button>

                                                {/* Новая кнопка для ссылки */}
                                                <Button
                                                    icon={<SettingOutlined/>}
                                                    onClick={() => showLinkModal(project)}
                                                    title="Получить ссылку для событий"
                                                />

                                                {['admin', 'project_manager'].includes(userRole) && (
                                                    <Popconfirm
                                                        title="Удалить проект?"
                                                        description="Вы уверены, что хотите удалить этот проект?"
                                                        onConfirm={() => handleDeleteProject(project.uuid)}
                                                        okText="Да"
                                                        cancelText="Нет"
                                                    >
                                                        <Button danger icon={<DeleteOutlined/>}/>
                                                    </Popconfirm>
                                                )}
                                            </Space>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={<Text strong style={{fontSize: '1.1rem'}}>{project.title}</Text>}
                                            description={
                                                <Space direction="vertical" size={4}>
                                                    <Text type="secondary">{project.description}</Text>
                                                    <div style={{marginTop: 8}}>
                                                        {project.users.slice(0, 3).map(user => (
                                                            <Avatar
                                                                key={user.id}
                                                                src={null}
                                                                icon={<UserOutlined/>}
                                                                style={{marginRight: 8, backgroundColor: '#8A2BE2'}}
                                                                title={user.name}
                                                            />
                                                        ))}
                                                        {project.users.length > 3 && (
                                                            <Avatar>+{project.users.length - 3}</Avatar>
                                                        )}
                                                    </div>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />)}
                    </Card>

                    {/* Модальное окно создания проекта */}
                    <Modal
                        title="Создание нового проекта"
                        open={isCreateModalVisible}
                        onOk={handleCreateProject}
                        onCancel={() => {
                            form.resetFields();
                            setIsCreateModalVisible(false);
                        }}
                        okText="Создать"
                        cancelText="Отмена"
                        width={600}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                        >
                            <Form.Item
                                name="title"
                                label="Название проекта"
                                rules={[
                                    {required: true, message: 'Введите название проекта'},
                                    {max: 100, message: 'Максимум 100 символов'}
                                ]}
                            >
                                <Input placeholder="Например: Мобильное приложение"/>
                            </Form.Item>
                            <Form.Item
                                name="description"
                                label="Описание проекта"
                                rules={[
                                    {required: true, message: 'Введите описание проекта'},
                                    {max: 500, message: 'Максимум 500 символов'}
                                ]}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Краткое описание целей и задач проекта"
                                />
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* Модальное окно управления участниками */}
                    <Modal
                        title={
                            <Space align="center" size="middle">
                                <Text strong style={{fontSize: '1.2rem'}}>Управление участниками проекта</Text>
                                {currentProject && <Tag color="purple">{currentProject.title}</Tag>}
                            </Space>
                        }
                        open={isMembersModalVisible}
                        onOk={handleUpdateMembers}
                        onCancel={() => setIsMembersModalVisible(false)}
                        okText="Сохранить"
                        cancelText="Отмена"
                        width={600}
                        bodyStyle={{paddingTop: 12}}
                    >
                        {currentProject && (
                            <Form form={membersForm} layout="vertical">
                                <Form.Item
                                    name="members"
                                    label={<Text strong>Выберите участников проекта</Text>}
                                    style={{marginBottom: 32}}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Начните вводить имя или логин"
                                        optionLabelProp="label"
                                        style={{width: '100%'}}
                                        maxTagCount="responsive"
                                        showSearch
                                        filterOption={(input, option) =>
                                            option.label.toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {allUsers.map(user => (
                                            <Option
                                                key={user.id}
                                                value={user.id}
                                                label={`${user.name} (${user.login})`}
                                            >
                                                <div>
                                                    <Text strong>{user.name}</Text>
                                                    <br/>
                                                    <Text type="secondary" style={{fontSize: 12}}>
                                                        {user.login}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Divider/>

                                <div>
                                    <Text strong style={{fontSize: 16}}>Текущие участники</Text>
                                    {currentProject.users.length > 0 ? (
                                        <List
                                            size="small"
                                            dataSource={currentProject.users}
                                            style={{marginTop: 12, maxHeight: 200, overflowY: 'auto'}}
                                            bordered
                                            renderItem={user => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={<Avatar icon={<UserOutlined/>}/>}
                                                        title={<Text>{user.name}</Text>}
                                                        description={<Text type="secondary">{user.login}</Text>}
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <Text type="secondary" style={{marginTop: 12, display: 'block'}}>
                                            Нет участников
                                        </Text>
                                    )}
                                </div>
                            </Form>
                        )}
                    </Modal>

                    <Modal
                        title={
                            <Space align="center" size="middle">
                                <LinkOutlined style={{color: '#8A2BE2'}}/>
                                <Text strong style={{fontSize: '1.2rem'}}>
                                    Ссылка для интеграции
                                </Text>
                                {linkProject && (
                                    <Tag color="purple" style={{marginLeft: 8}}>
                                        {linkProject.title}
                                    </Tag>
                                )}
                            </Space>
                        }
                        open={isLinkModalVisible}
                        onCancel={handleLinkModalCancel}
                        footer={[
                            <Button key="close" type="primary" onClick={handleLinkModalCancel}>
                                Готово
                            </Button>,
                        ]}
                        width={650}
                        bodyStyle={{padding: '24px 24px 16px'}}
                    >
                        {loadingLink ? (
                            <div style={{display: 'flex', justifyContent: 'center', padding: '24px 0'}}>
                                <Spin size="large"/>
                            </div>
                        ) : eventLink ? (
                            <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                <Text type="secondary">
                                    Используйте эту ссылку для отправки событий в ваш проект:
                                </Text>

                                <div
                                    style={{
                                        position: 'relative',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: 6,
                                        padding: '8px 12px',
                                        backgroundColor: '#fafafa',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: "'Fira Code', monospace",
                                            fontSize: 14,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {eventLink}
                                    </Text>
                                    <Button
                                        icon={<CopyOutlined/>}
                                        type="text"
                                        style={{
                                            position: 'absolute',
                                            right: 8,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                        }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(eventLink);
                                            message.success('Скопировано!');
                                        }}
                                    />

                                </div>

                                <Divider style={{margin: '16px 0'}}/>

                                <Text strong>Пример использования Python (Sentry):</Text>
                                <pre
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        padding: 12,
                                        borderRadius: 6,
                                        margin: 0,
                                        fontSize: 13,
                                        fontFamily: "'Fira Code', monospace",
                                        whiteSpace: 'pre-wrap',
                                        position: 'relative',
                                    }}
                                >
        {`import sentry_sdk

sentry_sdk.init(
    "${eventLink}",
    traces_sample_rate=1.0,
)


def get_element_by_index(index: int) -> int:
    lst = [1, 2, 3, 4, 5, 6, 7]
    return lst[index]


if __name__ == "__main__":
    get_element_by_index(index=9)`}
                                    <Button
                                        icon={<CopyOutlined/>}
                                        type="text"
                                        size="small"
                                        style={{position: 'absolute', right: 8, top: 8}}
                                        onClick={() => {
                                            const code = `import sentry_sdk

sentry_sdk.init(
    "${eventLink}",
    traces_sample_rate=1.0,
)


def get_element_by_index(index: int) -> int:
    lst = [1, 2, 3, 4, 5, 6, 7]
    return lst[index]


if __name__ == "__main__":
    get_element_by_index(index=9)
`;
                                            navigator.clipboard.writeText(code);
                                            message.success('Код скопирован!');
                                        }}
                                    />
      </pre>
                            </Space>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 100,
                                }}
                            >
                                <Text type="danger">Не удалось загрузить ссылку</Text>
                            </div>
                        )}
                    </Modal>


                </div>
            </div>
        </ConfigProvider>
    );
}