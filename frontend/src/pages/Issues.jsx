import {useEffect, useState} from 'react';
import {
    Card,
    ConfigProvider,
    Descriptions,
    List,
    message,
    Modal,
    Radio,
    Select,
    Space,
    Spin,
    Tag,
    Typography
} from 'antd';
import Aside from "../components/Aside.jsx";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {oneLight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import axios from "axios";

const {Text} = Typography;
const {Option} = Select;

const TIME_FILTERS = [
    {label: '1 день', value: '1d'},
    {label: '14 дней', value: '14d'},
    {label: '1 месяц', value: '1m'},
    {label: 'Все время', value: 'all'}
];

export default function Issues({userRole}) {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [timeFilter, setTimeFilter] = useState('14d');
    const [selectedProjects, setSelectedProjects] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [events, timeFilter, selectedProjects]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8039/api/events', {
                withCredentials: true,
            });
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            message.error('Ошибка загрузки событий');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!events.length) return;

        let filteredByTime = [...events];
        if (timeFilter !== 'all') {
            let cutoffDate;
            switch (timeFilter) {
                case '1d':
                    cutoffDate = dayjs().subtract(1, 'day');
                    break;
                case '14d':
                    cutoffDate = dayjs().subtract(14, 'days');
                    break;
                case '1m':
                    cutoffDate = dayjs().subtract(1, 'month');
                    break;
            }

            filteredByTime = events.filter(event =>
                dayjs(event.timestamp).isAfter(cutoffDate)
            );
        }

        let filteredByProjects = filteredByTime;
        if (selectedProjects.length > 0) {
            filteredByProjects = filteredByTime.filter(event =>
                selectedProjects.includes(event.project_uuid)
            );
        }

        setFilteredEvents(filteredByProjects);
    };

    const handleProjectFilterChange = (selectedProjectUuids) => {
        setSelectedProjects(selectedProjectUuids);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedEvent(null);
    };

    const getUniqueProjects = () => {
        const projectsMap = new Map();
        events.forEach(event => {
            if (event.project_uuid && !projectsMap.has(event.project_uuid)) {
                projectsMap.set(event.project_uuid, {
                    uuid: event.project_uuid,
                    title: event.project_title || `Проект ${event.project_uuid.slice(0, 4)}`
                });
            }
        });
        return Array.from(projectsMap.values());
    };

    const getChartData = () => {
        if (filteredEvents.length === 0) return {dates: [], counts: []};

        const now = dayjs();
        let startDate;

        switch (timeFilter) {
            case '1d':
                startDate = now.subtract(1, 'day');
                break;
            case '14d':
                startDate = now.subtract(14, 'days');
                break;
            case '1m':
                startDate = now.subtract(1, 'month');
                break;
            case 'all':
                startDate = dayjs(
                    filteredEvents.reduce((oldest, event) =>
                            dayjs(event.timestamp).isBefore(dayjs(oldest.timestamp)) ? event : oldest
                        , filteredEvents[0]).timestamp
                );
                break;
        }

        const dayCounts = {};
        const daysDiff = now.diff(startDate, 'day') + 1;

        for (let i = 0; i < daysDiff; i++) {
            const date = startDate.add(i, 'day').format('YYYY-MM-DD');
            dayCounts[date] = 0;
        }

        filteredEvents.forEach(event => {
            const date = dayjs(event.timestamp).format('YYYY-MM-DD');
            if (dayCounts[date] !== undefined) {
                dayCounts[date]++;
            }
        });

        const dates = Object.keys(dayCounts).sort();
        const counts = dates.map(date => dayCounts[date]);

        return {dates, counts};
    };

    const {dates, counts} = getChartData();

    const chartOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: (params) => {
                const date = params[0].axisValue;
                const count = params[0].data;
                return `${date}<br/>Событий: <b>${count}</b>`;
            }
        },
        grid: {
            left: '0',
            right: '0',
            top: '0',
            bottom: '0',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates.map(date => dayjs(date).format('DD.MM')),
            axisLabel: {
                color: '#666'
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            },
            axisTick: {
                alignWithLabel: true
            }
        },
        yAxis: {
            show: false,
        },
        series: [{
            name: 'События',
            type: 'line',
            smooth: false,
            showSymbol: false,
            data: counts,
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {offset: 0, color: 'rgba(138, 43, 226, 0.8)'},
                    {offset: 1, color: 'rgba(138, 43, 226, 0.1)'}
                ])
            },
            lineStyle: {
                width: 1,
                color: '#8A2BE2'
            },
        }]
    };

    const getLevelColor = (level) => {
        switch (level.toLowerCase()) {
            case 'error':
                return 'red';
            case 'warning':
                return 'orange';
            case 'info':
                return 'blue';
            case 'critical':
                return 'volcano';
            default:
                return 'purple';
        }
    };

    const getProjectTitle = (projectUuid) => {
        const event = events.find(e => e.project_uuid === projectUuid);
        return event?.project_title || `Проект ${projectUuid.slice(0, 4)}`;
    };

    const uniqueProjects = getUniqueProjects();

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
                <Aside userRole={userRole} />
                <div style={{marginLeft: 350, padding: 24, width: '100%'}}>
                    <Card
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            marginBottom: 24,
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16
                        }}>
                            <Select
                                mode="multiple"
                                placeholder="Выберите проекты"
                                value={selectedProjects}
                                onChange={handleProjectFilterChange}
                                style={{width: '40%'}}
                                optionLabelProp="label"
                                optionFilterProp="label"
                                loading={loading}
                            >
                                {uniqueProjects.map(project => (
                                    <Option
                                        key={project.uuid}
                                        value={project.uuid}
                                        label={project.title}
                                    >
                                        {project.title}
                                    </Option>
                                ))}
                            </Select>

                            <Radio.Group
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                buttonStyle="solid"
                            >
                                <Space>
                                    {TIME_FILTERS.map(filter => (
                                        <Radio.Button
                                            key={filter.value}
                                            value={filter.value}
                                            style={{
                                                borderRadius: '8px',
                                                borderColor: timeFilter === filter.value ? '#8A2BE2' : '#d9d9d9',
                                                color: timeFilter === filter.value ? '#ffffff' : 'inherit',
                                                backgroundColor: timeFilter === filter.value ? '#8A2BE2' : 'inherit'
                                            }}
                                        >
                                            {filter.label}
                                        </Radio.Button>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </div>
                        <ReactECharts
                            option={chartOption}
                            style={{height: 150}}
                            theme="light"
                            opts={{renderer: 'svg'}}
                        />
                    </Card>

                    <Card
                        bordered={false}
                        style={{
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px'
                        }}
                        bodyStyle={{padding: 0}}
                    >
                        {loading ? (
                            <div style={{padding: 24, textAlign: 'center'}}>
                                <Spin tip="Загрузка данных..." size="large"/>
                            </div>
                        ) : (
                            <List
                                itemLayout="horizontal"
                                dataSource={filteredEvents.sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)))}
                                renderItem={(item) => (
                                    <List.Item
                                        onClick={() => handleEventClick(item)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '16px 24px',
                                            borderBottom: '1px solid #f0f0f0',
                                            transition: 'all 0.3s',
                                            ':hover': {
                                                backgroundColor: '#fafafa',
                                                boxShadow: '0 2px 8px rgba(138, 43, 226, 0.2)'
                                            }
                                        }}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <div style={{display: 'flex', alignItems: 'center'}}>
                                                    <Text strong style={{fontSize: '1.1rem', marginRight: 8}}>
                                                        {item.type}
                                                    </Text>
                                                    <Tag
                                                        color={getLevelColor(item.level)}
                                                        style={{
                                                            borderRadius: '4px',
                                                            borderWidth: '0px'
                                                        }}
                                                    >
                                                        {item.level}
                                                    </Tag>
                                                    {selectedProjects.length === 0 && (
                                                        <Tag color="purple" style={{marginLeft: 8}}>
                                                            {item.project_title || `Проект ${item.project_uuid.slice(0, 4)}`}
                                                        </Tag>
                                                    )}
                                                </div>
                                            }
                                            description={
                                                <div>
                                                    <Text type="secondary" style={{fontSize: '0.9rem'}}>
                                                        {item.value}
                                                    </Text>
                                                    <div style={{marginTop: 4}}>
                                                        <Text type="secondary" style={{fontSize: '0.8rem'}}>
                                                            {dayjs(item.timestamp).format('DD.MM.YYYY HH:mm')} • {item.filename}:{item.lineno} • {item.platform}
                                                        </Text>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>

                    <Modal
                        title={
                            <div>
                                <Text strong style={{fontSize: '1.2rem'}}>{selectedEvent?.type}</Text>
                                <Tag
                                    color={selectedEvent ? getLevelColor(selectedEvent.level) : 'blue'}
                                    style={{marginLeft: 8, borderRadius: '4px', borderWidth: '0px'}}
                                >
                                    {selectedEvent?.level}
                                </Tag>
                            </div>
                        }
                        visible={isModalVisible}
                        onCancel={handleCloseModal}
                        footer={null}
                        width={800}
                        centered
                        bodyStyle={{padding: 24}}
                    >
                        {selectedEvent && (
                            <div>
                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    padding: '10px',
                                    marginBottom: '20px',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '8px'
                                }}>
                                    <SyntaxHighlighter
                                        language="python"
                                        style={oneLight}
                                        showLineNumbers={true}
                                        startingLineNumber={selectedEvent.start_line}
                                        wrapLines={true}
                                        lineProps={(lineNumber) => ({
                                            style: {
                                                display: "block",
                                                backgroundColor: lineNumber === selectedEvent.lineno ? "#f6e6ff" : "transparent",
                                                padding: "4px 0",
                                            },
                                        })}
                                    >
                                        {selectedEvent.context}
                                    </SyntaxHighlighter>
                                </div>

                                <Descriptions bordered column={1} size="middle">
                                    <Descriptions.Item label="Дата">
                                        {dayjs(selectedEvent.timestamp).format('DD.MM.YYYY HH:mm')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Проект">
                                        {selectedEvent.project_title || `Проект ${selectedEvent.project_uuid.slice(0, 4)}`}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Функция">{selectedEvent.function}</Descriptions.Item>
                                    <Descriptions.Item label="Файл">{selectedEvent.abs_path}</Descriptions.Item>
                                    <Descriptions.Item label="Строка">{selectedEvent.lineno}</Descriptions.Item>
                                    <Descriptions.Item label="Тип">{selectedEvent.type}</Descriptions.Item>
                                    <Descriptions.Item label="Значение">{selectedEvent.value}</Descriptions.Item>
                                    <Descriptions.Item label="Модуль">{selectedEvent.module}</Descriptions.Item>
                                    <Descriptions.Item label="Версия">{selectedEvent.runtime_name} {selectedEvent.runtime_version}</Descriptions.Item>
                                    <Descriptions.Item label="Платформа">{selectedEvent.platform}</Descriptions.Item>
                                    <Descriptions.Item label="Сервер">{selectedEvent.server_name}</Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}
                    </Modal>
                </div>
            </div>
        </ConfigProvider>
    );
}