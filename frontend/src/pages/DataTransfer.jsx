import { useState, useCallback } from 'react';
import {
    Card,
    ConfigProvider,
    Typography,
    Button,
    Divider,
    Checkbox,
    Radio,
    Space,
    Select,
    Upload,
    message,
    Spin, Row, Col
} from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import Aside from "../components/Aside.jsx";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const MOCK_PROJECTS = [
    { id: '1', name: 'Основной проект' },
    { id: '2', name: 'Мобильное приложение' },
    { id: '3', name: 'Админ панель' },
    { id: '4', name: 'API сервис' },
    { id: '5', name: 'Аналитика' }
];

const EXPORT_FIELDS = [
    { label: 'Тип ошибки', value: 'exception_type' },
    { label: 'Сообщение ошибки', value: 'exception_message' },
    { label: 'Важность', value: 'severity' },
    { label: 'Файл и строка', value: 'path_line' },
    { label: 'Функция', value: 'function' },
    { label: 'Временная метка', value: 'timestamp' },
    { label: 'Операционная система', value: 'operation_system' },
    { label: 'Версия', value: 'python_version' }
];

const EXPORT_PERIODS = [
    { label: '1 день', value: '1d' },
    { label: '14 дней', value: '14d' },
    { label: '1 месяц', value: '1m' },
    { label: 'Все время', value: 'all' }
];

export default function DataTransfer({userRole}) {
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFields, setSelectedFields] = useState(EXPORT_FIELDS.map(f => f.value));
    const [exportPeriod, setExportPeriod] = useState('14d');
    const [exportProjects, setExportProjects] = useState([]);
    const [importProject, setImportProject] = useState(null);
    const [fileList, setFileList] = useState([]);

    const handleExport = () => {
        setExportLoading(true);
        setTimeout(() => {
            const data = {
                fields: selectedFields,
                period: exportPeriod,
                projects: exportProjects,
                data: []
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `errors_export_${dayjs().format('YYYY-MM-DD')}.json`;
            a.click();

            URL.revokeObjectURL(url);
            setExportLoading(false);
            message.success('Экспорт данных завершен');
        }, 1500);
    };


    const handleImport = () => {
        if (!importProject) {
            message.warning('Выберите проект для импорта');
            return;
        }

        if (fileList.length === 0) {
            message.warning('Выберите файл для импорта');
            return;
        }

        setImportLoading(true);
        setTimeout(() => {
            setImportLoading(false);
            message.success(`Данные успешно импортированы в проект ${MOCK_PROJECTS.find(p => p.id === importProject)?.name}`);
            setFileList([]);
        }, 2000);
    };

    const beforeUpload = useCallback((file) => {
        const isJson = file.type === 'application/json';
        if (!isJson) {
            message.error('Можно загружать только JSON файлы!');
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Файл должен быть меньше 2MB!');
            return Upload.LIST_IGNORE;
        }

        return false;
    }, []);

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
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
                    Checkbox: {
                        colorPrimary: '#8A2BE2',
                    },
                },
            }}
        >
            <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Aside userRole={userRole} />
                <div style={{ marginLeft: 350, padding: 24, width: '100%' }}>
                    <Title level={2} style={{ color: '#2c3959', marginBottom: 24 }}>
                        Импорт и экспорт данных
                    </Title>

                    {/* Секция экспорта */}
                    <Card
                        title={
                            <Text strong style={{ fontSize: '1.2rem' }}>
                                Экспорт данных
                            </Text>
                        }
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            marginBottom: 24,
                        }}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Выберите поля для экспорта:
                            </Text>
                            <Checkbox.Group
                                options={EXPORT_FIELDS}
                                value={selectedFields}
                                onChange={setSelectedFields}
                                style={{ width: '100%' }}
                            >
                                <Row gutter={[16, 16]}>
                                    {EXPORT_FIELDS.map(field => (
                                        <Col span={8} key={field.value}>
                                            <Checkbox value={field.value}>{field.label}</Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Выберите период:
                            </Text>
                            <Radio.Group
                                value={exportPeriod}
                                onChange={(e) => setExportPeriod(e.target.value)}
                                buttonStyle="solid"
                            >
                                <Space>
                                    {EXPORT_PERIODS.map(period => (
                                        <Radio.Button
                                            key={period.value}
                                            value={period.value}
                                            style={{
                                                borderRadius: '8px',
                                                borderColor: exportPeriod === period.value ? '#8A2BE2' : '#d9d9d9',
                                                color: exportPeriod === period.value ? '#ffffff' : 'inherit',
                                                backgroundColor: exportPeriod === period.value ? '#8A2BE2' : 'inherit'
                                            }}
                                        >
                                            {period.label}
                                        </Radio.Button>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Выберите проекты:
                            </Text>
                            <Select
                                mode="multiple"
                                placeholder="Все проекты"
                                value={exportProjects}
                                onChange={setExportProjects}
                                style={{ width: '100%' }}
                                optionLabelProp="label"
                                optionFilterProp="label"
                            >
                                {MOCK_PROJECTS.map(project => (
                                    <Option
                                        key={project.id}
                                        value={project.id}
                                        label={project.name}
                                    >
                                        {project.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            loading={exportLoading}
                            style={{
                                backgroundColor: '#8A2BE2',
                                borderRadius: '8px',
                                height: '40px',
                                width: '100%'
                            }}
                        >
                            Экспортировать данные
                        </Button>
                    </Card>

                    {/* Секция импорта */}
                    <Card
                        title={
                            <Text strong style={{ fontSize: '1.2rem' }}>
                                Импорт данных
                            </Text>
                        }
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                        }}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Выберите проект для импорта:
                            </Text>
                            <Select
                                placeholder="Выберите проект"
                                value={importProject}
                                onChange={setImportProject}
                                style={{ width: '100%' }}
                                optionLabelProp="label"
                            >
                                {MOCK_PROJECTS.map(project => (
                                    <Option
                                        key={project.id}
                                        value={project.id}
                                        label={project.name}
                                    >
                                        {project.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Выберите файл для импорта:
                            </Text>
                            <Upload.Dragger
                                name="file"
                                multiple={false}
                                fileList={fileList}
                                beforeUpload={beforeUpload}
                                onChange={handleChange}
                                accept=".json"
                                style={{
                                    padding: '24px',
                                    borderRadius: '8px',
                                    border: '1px dashed #d9d9d9',
                                    backgroundColor: '#fafafa',
                                }}
                            >
                                <p className="ant-upload-drag-icon">
                                    <UploadOutlined style={{ color: '#8A2BE2' }} />
                                </p>
                                <p className="ant-upload-text">
                                    Нажмите или перетащите файл в эту область
                                </p>
                                <p className="ant-upload-hint">
                                    Поддерживаются только JSON файлы
                                </p>
                            </Upload.Dragger>
                        </div>

                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={handleImport}
                            loading={importLoading}
                            style={{
                                backgroundColor: '#8A2BE2',
                                borderRadius: '8px',
                                height: '40px',
                                width: '100%'
                            }}
                        >
                            Импортировать данные
                        </Button>
                    </Card>
                </div>
            </div>
        </ConfigProvider>
    );
}