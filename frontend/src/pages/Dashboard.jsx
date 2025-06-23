import {useEffect, useState} from 'react';
import {Card, Col, ConfigProvider, Radio, Row, Spin, Statistic, Typography, Select} from 'antd';
import Aside from "../components/Aside.jsx";
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import {
    BugOutlined,
    LineChartOutlined,
    PieChartOutlined
} from '@ant-design/icons';
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

const TIME_FILTERS = [
    { label: '1 день', value: '1d' },
    { label: '14 дней', value: '14d' },
    { label: '1 месяц', value: '1m' },
    { label: 'Все время', value: 'all' }
];

export default function Dashboard({userRole}) {
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [projectFilter, setProjectFilter] = useState([]);
    const [projects, setProjects] = useState([]);
    const [timeFilter, setTimeFilter] = useState('14d');
    const [stats, setStats] = useState({
        totalIssues: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0
    });

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        if (issues.length > 0) {
            const uniqueProjects = Array.from(
                new Map(
                    issues.map(issue => [issue.project_uuid, { uuid: issue.project_uuid, title: issue.project_title }])
                ).values()
            );
            setProjects(uniqueProjects);
            applyFilters();
        }
    }, [issues, timeFilter, projectFilter]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8039/api/events', {
                withCredentials: true
            });
            setIssues(response.data);
        } catch (error) {
            console.error('Ошибка загрузки событий:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = issues;

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
            default:
                cutoffDate = null;
        }

        if (cutoffDate) {
            filtered = filtered.filter(issue => dayjs(issue.timestamp).isAfter(cutoffDate));
        }

        if (projectFilter.length > 0) {
            filtered = filtered.filter(issue => projectFilter.includes(issue.project_uuid));
        }

        setFilteredIssues(filtered);
        updateStats(filtered);
    };

    const updateStats = (issues) => {
        const high = issues.filter(issue => issue.severity === 'high' || issue.severity === 'critical').length;
        const medium = issues.filter(issue => issue.severity === 'medium').length;
        const low = issues.filter(issue => issue.severity === 'low' || issue.severity === 'info').length;

        setStats({
            totalIssues: issues.length,
            highSeverity: high,
            mediumSeverity: medium,
            lowSeverity: low
        });
    };

    const generateIssuesByDayData = () => {
        const now = dayjs();
        let startDate;

        if (timeFilter === 'all') {
            if (filteredIssues.length === 0) return { dates: [], counts: [] };
            const oldestIssue = filteredIssues.reduce((oldest, issue) =>
                dayjs(issue.timestamp).isBefore(dayjs(oldest.timestamp)) ? issue : oldest
            );
            startDate = dayjs(oldestIssue.timestamp);
        } else {
            const unit = timeFilter === '1d' ? 'day' : timeFilter === '14d' ? 'days' : 'month';
            const amount = timeFilter === '1d' ? 1 : timeFilter === '14d' ? 14 : 1;
            startDate = now.subtract(amount, unit);
        }

        const daysDiff = now.diff(startDate, 'day') + 1;
        const dayCounts = {};

        for (let i = 0; i < daysDiff; i++) {
            const date = startDate.add(i, 'day').format('DD.MM');
            dayCounts[date] = 0;
        }

        filteredIssues.forEach(issue => {
            const date = dayjs(issue.timestamp).format('DD.MM');
            if (dayCounts[date] !== undefined) {
                dayCounts[date]++;
            }
        });

        const dates = Object.keys(dayCounts);
        const counts = dates.map(date => dayCounts[date]);

        return { dates, counts };
    };

    const generateSeverityDistribution = () => [
        { value: stats.highSeverity, name: 'High' },
        { value: stats.mediumSeverity, name: 'Medium' },
        { value: stats.lowSeverity, name: 'Low' }
    ];

    const generateOsDistribution = () => {
        const osCounts = {};
        filteredIssues.forEach(issue => {
            const os = issue.server_name || 'Unknown';
            osCounts[os] = (osCounts[os] || 0) + 1;
        });
        return Object.entries(osCounts).map(([name, value]) => ({ name, value }));
    };

    const { dates, counts } = generateIssuesByDayData();
    const severityData = generateSeverityDistribution();
    const osData = generateOsDistribution();

    const issuesChartOption = {
        tooltip: {
            trigger: 'axis',
            formatter: params => `${params[0].axisValue}<br/>Ошибок: <b>${params[0].data}</b>`
        },
        xAxis: {
            type: 'category',
            data: dates
        },
        yAxis: { type: 'value' },
        series: [{
            name: 'Ошибки',
            type: 'line',
            data: counts,
            areaStyle: {},
            lineStyle: { width: 3, color: '#8A2BE2' },
            itemStyle: { color: '#8A2BE2' },
            smooth: true
        }]
    };

    const severityChartOption = {
        tooltip: { trigger: 'item' },
        legend: { right: 10, top: 'center' },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            data: severityData,
            color: ['#ff4d4f', '#faad14', '#52c41a']
        }]
    };

    const osChartOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
            type: 'pie',
            radius: '70%',
            center: ['50%', '50%'],
            data: osData,
            label: { formatter: '{b}: {c}' },
            color: ['#722ED1', '#9254DE', '#B37FEB', '#D3ADF7', '#EFDBFF']
        }]
    };

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#8A2BE2' } }}>
            <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Aside userRole={userRole} />
                <div style={{ marginLeft: 350, padding: 24, width: '100%' }}>
                    {loading ? <Spin size="large" tip="Загрузка данных..." /> : (
                        <>
                            <Title level={2} style={{ marginBottom: 24 }}>
                                <LineChartOutlined style={{ marginRight: 12 }} />
                                Аналитика ошибок
                            </Title>

                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col>
                                    <Select
                                        mode="multiple"
                                        placeholder="Выберите проекты"
                                        value={projectFilter}
                                        onChange={setProjectFilter}
                                        style={{ width: 300 }}
                                        allowClear
                                    >
                                        {projects.map(p => (
                                            <Option key={p.uuid} value={p.uuid}>{p.title}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col>
                                    <Radio.Group
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        {TIME_FILTERS.map(filter => (
                                            <Radio.Button key={filter.value} value={filter.value}>
                                                {filter.label}
                                            </Radio.Button>
                                        ))}
                                    </Radio.Group>
                                </Col>
                            </Row>

                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Card><Statistic title="Всего ошибок" value={stats.totalIssues} prefix={<BugOutlined />} valueStyle={{ color: '#8A2BE2' }} /></Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card><Statistic title="Высокая важность" value={stats.highSeverity} valueStyle={{ color: '#ff4d4f' }} /></Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card><Statistic title="Средняя важность" value={stats.mediumSeverity} valueStyle={{ color: '#faad14' }} /></Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card><Statistic title="Низкая важность" value={stats.lowSeverity} valueStyle={{ color: '#52c41a' }} /></Card>
                                </Col>
                            </Row>

                            <Card style={{ margin: '24px 0' }}>
                                <ReactECharts option={issuesChartOption} style={{ height: 400 }} />
                            </Card>

                            <Row gutter={24}>
                                <Col xs={24} md={12}>
                                    <Card title="Важность ошибок">
                                        <ReactECharts option={severityChartOption} style={{ height: 300 }} />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Имена серверов">
                                        <ReactECharts option={osChartOption} style={{ height: 300 }} />
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </div>
            </div>
        </ConfigProvider>
    );
}
